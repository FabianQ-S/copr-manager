import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

function runCommand(argv) {
  try {
    const proc = Gio.Subprocess.new(
      argv,
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
    );

    const [, stdout, stderr] = proc.communicate_utf8(null, null);
    return {
      ok: proc.get_successful(),
      stdout: stdout ?? '',
      stderr: stderr ?? '',
    };
  } catch (error) {
    return {
      ok: false,
      stdout: '',
      stderr: error.message,
    };
  }
}

function buildCoprUrl(owner, project) {
  return `https://copr.fedorainfracloud.org/coprs/${owner}/${project}/`;
}

function parseCoprFromDnfList(text, map) {
  const regex =
    /(?:copr\.fedorainfracloud\.org[/:]|@copr\/)([A-Za-z0-9._-]+)[/:]([A-Za-z0-9._-]+)/g;

  for (const match of text.matchAll(regex)) {
    const owner = match[1];
    const project = match[2];
    const repoId = `copr:copr.fedorainfracloud.org:${owner}:${project}`;

    map.set(repoId, {
      repoId,
      developer: owner,
      projectName: project,
      packageName: project,
      coprUrl: buildCoprUrl(owner, project),
      version: 'No disponible',
      enabled: null,
    });
  }
}

function parseRepoFile(content, map) {
  const lines = content.split('\n');
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();

    const section = line.match(
      /^\[(copr:copr\.fedorainfracloud\.org:([^:\]]+):([^\]]+))\]$/
    );

    if (section) {
      const repoId = section[1];
      const owner = section[2];
      const project = section[3];

      current = {
        repoId,
        developer: owner,
        projectName: project,
        packageName: project,
        coprUrl: buildCoprUrl(owner, project),
        version: 'No disponible',
        enabled: null,
      };

      const existing = map.get(repoId);
      map.set(repoId, existing ? { ...existing, ...current } : current);
      continue;
    }

    if (line.startsWith('[')) {
      current = null;
      continue;
    }

    if (!current) {
      continue;
    }

    const enabledMatch = line.match(/^enabled\s*=\s*([01])$/);
    if (enabledMatch) {
      const existing = map.get(current.repoId);
      if (existing) {
        existing.enabled = enabledMatch[1] === '1';
      }
    }
  }
}

function parseCoprFromRepoFiles(map) {
  const repoDir = Gio.File.new_for_path('/etc/yum.repos.d');

  let enumerator;
  try {
    enumerator = repoDir.enumerate_children(
      'standard::name,standard::type',
      Gio.FileQueryInfoFlags.NONE,
      null
    );
  } catch (_error) {
    return;
  }

  while (true) {
    const info = enumerator.next_file(null);
    if (!info) {
      break;
    }

    if (info.get_file_type() !== Gio.FileType.REGULAR) {
      continue;
    }

    const name = info.get_name();
    if (!name.endsWith('.repo') || !name.includes('copr')) {
      continue;
    }

    const repoPath = `/etc/yum.repos.d/${name}`;

    try {
      const [ok, bytes] = GLib.file_get_contents(repoPath);
      if (!ok) {
        continue;
      }

      const content = new TextDecoder().decode(bytes);
      parseRepoFile(content, map);
    } catch (_error) {
      continue;
    }
  }

  if (enumerator) {
    enumerator.close(null);
  }
}

function getRepoVersion(repoId) {
  const result = runCommand([
    'dnf',
    '-q',
    'repoquery',
    `--repoid=${repoId}`,
    '--qf',
    '%{name}|%{version}-%{release}',
    '--latest-limit',
    '1',
  ]);

  if (!result.ok) {
    return null;
  }

  const line = result.stdout
    .split('\n')
    .map((part) => part.trim())
    .find((part) => part.length > 0 && part.includes('|'));

  if (!line) {
    return null;
  }

  const [name, version] = line.split('|');
  if (!name || !version) {
    return null;
  }

  return {
    packageName: name,
    version,
  };
}

function statusText(value) {
  if (value === true) {
    return 'Activado';
  }

  if (value === false) {
    return 'Desactivado';
  }

  return 'Desconocido';
}

export function getInstalledCoprs() {
  const coprMap = new Map();

  const dnfList = runCommand(['dnf', '-q', 'copr', 'list']);
  if (dnfList.ok) {
    parseCoprFromDnfList(dnfList.stdout, coprMap);
  }

  parseCoprFromRepoFiles(coprMap);

  const coprs = Array.from(coprMap.values()).sort((a, b) => {
    const ownerCmp = a.developer.localeCompare(b.developer);
    if (ownerCmp !== 0) {
      return ownerCmp;
    }

    return a.packageName.localeCompare(b.packageName);
  });

  for (const copr of coprs) {
    copr.statusLabel = statusText(copr.enabled);

    const details = getRepoVersion(copr.repoId);
    if (!details) {
      continue;
    }

    copr.packageName = details.packageName;
    copr.version = details.version;
  }

  return coprs;
}
