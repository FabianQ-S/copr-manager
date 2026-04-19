#!/usr/bin/env -S gjs -m

import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';

import { CoprManagerWindow } from './window.js';

const APP_ID = 'io.github.gzenit.CoprManager';
const APP_VERSION = 'Alpha 1.0.0';

const CoprManagerApplication = GObject.registerClass(
class CoprManagerApplication extends Adw.Application {
  constructor() {
    super({
      application_id: APP_ID,
      flags: Gio.ApplicationFlags.FLAGS_NONE,
    });

    this._createActions();
  }

  _createActions() {
    const quit = new Gio.SimpleAction({ name: 'quit' });
    quit.connect('activate', () => this.quit());
    this.add_action(quit);
    this.set_accels_for_action('app.quit', ['<primary>q']);

    const about = new Gio.SimpleAction({ name: 'about' });
    about.connect('activate', () => this._showAboutDialog());
    this.add_action(about);
  }

  _showAboutDialog() {
    const dialog = new Adw.AboutDialog({
      application_name: 'COPR Manager',
      application_icon: APP_ID,
      developer_name: 'gzenit',
      version: APP_VERSION,
      comments: 'Gestion visual de repos COPR con GTK 4 y Libadwaita.',
      license_type: Gtk.License.GPL_3_0,
      website: 'https://copr.fedorainfracloud.org/',
      issue_url: 'https://copr.fedorainfracloud.org/',
    });

    dialog.present(this.active_window);
  }

  vfunc_activate() {
    let win = this.active_window;
    if (!win) {
      win = new CoprManagerWindow(this);
    }

    win.present();
  }
}
);

function loadCss() {
  const file = Gio.File.new_for_uri(import.meta.url);
  const dirPath = file.get_parent().get_path();
  const cssPath = `${dirPath}/style.css`;

  const provider = new Gtk.CssProvider();
  provider.load_from_path(cssPath);

  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default(),
    provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
  );
}

Adw.init();
loadCss();

const app = new CoprManagerApplication();
app.run([]);
