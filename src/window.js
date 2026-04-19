import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';

import { getInstalledCoprs } from './coprs.js';

export const CoprManagerWindow = GObject.registerClass(
class CoprManagerWindow extends Adw.ApplicationWindow {
  constructor(application) {
    super({
      application,
      title: 'COPR Manager',
      default_width: 1080,
      default_height: 720,
    });

    this._buildUi();

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      this.reloadCoprs();
      return GLib.SOURCE_REMOVE;
    });
  }

  _buildUi() {
    this.toastOverlay = new Adw.ToastOverlay();
    this.set_content(this.toastOverlay);

    const toolbarView = new Adw.ToolbarView();
    this.toastOverlay.set_child(toolbarView);

    const headerBar = new Adw.HeaderBar();
    const title = new Adw.WindowTitle({
      title: 'COPR Manager',
      subtitle: 'Alpha 1.0.0',
    });

    headerBar.set_title_widget(title);

    this.refreshButton = new Gtk.Button({
      icon_name: 'view-refresh-symbolic',
      tooltip_text: 'Recargar repos COPR',
      css_classes: ['flat'],
    });

    this.refreshButton.connect('clicked', () => this.reloadCoprs());
    headerBar.pack_end(this.refreshButton);

    toolbarView.add_top_bar(headerBar);

    const content = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 14,
      margin_top: 14,
      margin_bottom: 14,
      margin_start: 14,
      margin_end: 14,
    });

    this.statusLabel = new Gtk.Label({
      xalign: 0,
      css_classes: ['dim-label'],
      label: 'Listo para cargar repos COPR.',
    });

    content.append(this.statusLabel);

    this.stack = new Gtk.Stack({
      transition_type: Gtk.StackTransitionType.CROSSFADE,
      transition_duration: 260,
      hexpand: true,
      vexpand: true,
    });

    this.loadingPage = new Adw.StatusPage({
      icon_name: 'network-workgroup-symbolic',
      title: 'Cargando repos COPR',
      description:
        'Consultando dnf y archivos de repos para construir las tarjetas.',
    });

    this.emptyPage = new Adw.StatusPage({
      icon_name: 'folder-symbolic',
      title: 'No se detectaron repos COPR',
      description:
        'No hay repos COPR instalados o no se pudieron leer desde el sistema.',
    });

    this.errorPage = new Adw.StatusPage({
      icon_name: 'dialog-warning-symbolic',
      title: 'Error al cargar COPR',
      description: 'Revisa permisos y disponibilidad de dnf.',
    });

    const scrolled = new Gtk.ScrolledWindow({
      hscrollbar_policy: Gtk.PolicyType.NEVER,
      vexpand: true,
      hexpand: true,
    });

    this.flowBox = new Gtk.FlowBox({
      selection_mode: Gtk.SelectionMode.NONE,
      row_spacing: 14,
      column_spacing: 14,
      homogeneous: false,
      max_children_per_line: 3,
      min_children_per_line: 1,
      margin_top: 4,
      margin_bottom: 10,
      margin_start: 4,
      margin_end: 4,
    });

    scrolled.set_child(this.flowBox);

    this.stack.add_named(this.loadingPage, 'loading');
    this.stack.add_named(this.emptyPage, 'empty');
    this.stack.add_named(this.errorPage, 'error');
    this.stack.add_named(scrolled, 'list');
    this.stack.set_visible_child_name('loading');

    content.append(this.stack);
    toolbarView.set_content(content);
  }

  reloadCoprs() {
    this.refreshButton.set_sensitive(false);
    this.statusLabel.set_label('Actualizando informacion de COPR...');
    this.stack.set_visible_child_name('loading');

    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      try {
        const coprs = getInstalledCoprs();
        this._renderCards(coprs);
      } catch (error) {
        this.stack.set_visible_child_name('error');
        this.statusLabel.set_label(`Error: ${error.message}`);
      } finally {
        this.refreshButton.set_sensitive(true);
      }

      return GLib.SOURCE_REMOVE;
    });
  }

  _renderCards(coprs) {
    let child = this.flowBox.get_first_child();
    while (child) {
      const next = child.get_next_sibling();
      this.flowBox.remove(child);
      child = next;
    }

    if (coprs.length === 0) {
      this.stack.set_visible_child_name('empty');
      this.statusLabel.set_label('No hay tarjetas para mostrar.');
      return;
    }

    for (const copr of coprs) {
      this.flowBox.insert(this._buildCard(copr), -1);
    }

    this.stack.set_visible_child_name('list');

    const now = GLib.DateTime.new_now_local();
    const stamp = now.format('%d/%m/%Y %H:%M');
    this.statusLabel.set_label(
      `${coprs.length} repos COPR detectados. Ultima actualizacion: ${stamp}`
    );
  }

  _buildCard(copr) {
    const card = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 10,
      margin_top: 8,
      margin_bottom: 8,
      margin_start: 8,
      margin_end: 8,
      width_request: 320,
      css_classes: ['card', 'copr-card'],
    });

    const title = new Gtk.Label({
      label: copr.packageName,
      xalign: 0,
      wrap: true,
      css_classes: ['title-3'],
    });

    const subtitle = new Gtk.Label({
      label: `Desarrollador: ${copr.developer}`,
      xalign: 0,
      wrap: true,
      css_classes: ['dim-label'],
    });

    card.append(title);
    card.append(subtitle);

    card.append(this._infoRow('Version', copr.version));
    card.append(this._infoRow('Estado', copr.statusLabel));
    card.append(this._infoRow('Repo ID', copr.repoId));
    card.append(this._linkRow('Enlace', copr.coprUrl, copr.repoId));

    const actions = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 8,
      margin_top: 6,
    });

    const activateButton = new Gtk.Button({
      label: 'Activar',
      hexpand: true,
      css_classes: ['suggested-action'],
    });

    const disableButton = new Gtk.Button({
      label: 'Desactivar',
      hexpand: true,
    });

    const deleteButton = new Gtk.Button({
      label: 'Eliminar',
      hexpand: true,
      css_classes: ['destructive-action'],
    });

    activateButton.connect('clicked', () =>
      this._showUnavailable('activar', copr.repoId)
    );
    disableButton.connect('clicked', () =>
      this._showUnavailable('desactivar', copr.repoId)
    );
    deleteButton.connect('clicked', () =>
      this._showUnavailable('eliminar', copr.repoId)
    );

    actions.append(activateButton);
    actions.append(disableButton);
    actions.append(deleteButton);

    card.append(actions);

    return card;
  }

  _infoRow(label, value) {
    const row = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 8,
      hexpand: true,
    });

    const key = new Gtk.Label({
      label: `${label}:`,
      xalign: 0,
      css_classes: ['caption', 'dim-label'],
      width_chars: 11,
    });

    const content = new Gtk.Label({
      label: value,
      xalign: 0,
      wrap: true,
      hexpand: true,
      css_classes: ['monospace'],
      selectable: true,
    });

    row.append(key);
    row.append(content);
    return row;
  }

  _linkRow(label, url, repoId) {
    const row = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 8,
      hexpand: true,
    });

    const key = new Gtk.Label({
      label: `${label}:`,
      xalign: 0,
      css_classes: ['caption', 'dim-label'],
      width_chars: 11,
    });

    const link = new Gtk.LinkButton({
      uri: url,
      label: 'Abrir COPR',
      halign: Gtk.Align.START,
      tooltip_text: url,
    });

    const copyButton = new Gtk.Button({
      icon_name: 'edit-copy-symbolic',
      tooltip_text: 'Copiar URL',
      css_classes: ['flat'],
      halign: Gtk.Align.START,
    });

    copyButton.connect('clicked', () => this._copyToClipboard(url, repoId));

    row.append(key);
    row.append(link);
    row.append(copyButton);
    return row;
  }

  _copyToClipboard(url, repoId) {
    try {
      const clipboard = this.get_clipboard();
      clipboard.set(url);

      this.toastOverlay.add_toast(
        new Adw.Toast({
          title: `URL copiada al portapapeles (${repoId}).`,
          timeout: 2,
        })
      );
    } catch (_error) {
      this.toastOverlay.add_toast(
        new Adw.Toast({
          title: 'No se pudo copiar la URL al portapapeles.',
          timeout: 3,
        })
      );
    }
  }

  _showUnavailable(action, repoId) {
    this.toastOverlay.add_toast(
      new Adw.Toast({
        title: `Funcion ${action} no disponible en Alpha 1.0.0 (${repoId}).`,
        timeout: 3,
      })
    );
  }
}
);
