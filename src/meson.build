script_conf = configuration_data()
script_conf.set('GJS', find_program('gjs').full_path())
script_conf.set(
  'PKGDATADIR',
  join_paths(get_option('prefix'), get_option('datadir'), app_name)
)

script_file = configure_file(
  input: 'copr-manager.in',
  output: app_name,
  configuration: script_conf
)

install_data(
  ['main.js', 'window.js', 'coprs.js', 'style.css'],
  install_dir: join_paths(get_option('datadir'), app_name)
)

install_data(
  script_file,
  install_dir: get_option('bindir'),
  install_mode: 'rwxr-xr-x'
)
