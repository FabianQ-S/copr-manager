desktop_conf = configuration_data()
desktop_conf.set('APP_ID', app_id)
desktop_conf.set('APP_NAME', 'COPR Manager')
desktop_conf.set('APP_EXEC', app_name)

configure_file(
  input: 'io.github.gzenit.CoprManager.desktop.in',
  output: 'io.github.gzenit.CoprManager.desktop',
  configuration: desktop_conf,
  install: true,
  install_dir: join_paths(get_option('datadir'), 'applications')
)

install_data(
  'io.github.gzenit.CoprManager.metainfo.xml',
  install_dir: join_paths(get_option('datadir'), 'metainfo')
)

install_data(
  'icons/hicolor/512x512/apps/io.github.gzenit.CoprManager.png',
  install_dir: join_paths(
    get_option('datadir'),
    'icons',
    'hicolor',
    '512x512',
    'apps'
  )
)
