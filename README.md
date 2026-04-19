# COPR Manager

COPR Manager es una app visual en GTK 4 + Libadwaita (GJS) para gestionar repos COPR con interfaz de tarjetas.

## Estado

- Version: Alpha 1.0.0
- Stack: GJS + GTK 4 + Libadwaita
- Estado de release: primera version funcional publicada
- Repositorio: https://github.com/FabianQ-S/copr-manager

## Requisitos

- gjs
- gtk4-devel
- libadwaita-devel
- meson
- ninja-build

## Funcionalidades actuales

- Deteccion de repos COPR instalados usando:
  - dnf copr list
  - parseo de archivos .repo en /etc/yum.repos.d
- Vista de tarjetas por repo con:
  - nombre del paquete/proyecto
  - desarrollador
  - version detectada
  - estado (activado/desactivado/desconocido)
  - repoid
- Enlace directo del COPR por tarjeta
- Boton para copiar URL del COPR al portapapeles
- Boton para recargar informacion de repos
- Botones visibles de Activar, Desactivar y Eliminar con mensaje de funcion no disponible (placeholder alpha)
- Apartado Acerca de COPR Manager en menu de aplicacion con:
  - version
  - enlace a GitHub
  - enlace a issues
  - icono provisional

## Funciones por implementar

- Activar repo COPR
- Desactivar repo COPR
- Eliminar repo COPR
- Flujos con privilegios (pkexec/polkit)
- Confirmaciones de seguridad para acciones destructivas
- Busqueda y filtros avanzados
- Mejoras de accesibilidad y localizacion

## Ejecutar en desarrollo

Desde la raiz del proyecto:

```bash
gjs -m src/main.js
```

## Ejecutar con script de control

```bash
./copr-manager.sh start
./copr-manager.sh status
./copr-manager.sh logs
./copr-manager.sh stop
```

## Build con Meson

```bash
meson setup builddir
meson compile -C builddir
./builddir/src/copr-manager
```

## Instalacion local

```bash
meson setup builddir --prefix=/usr
meson compile -C builddir
sudo meson install -C builddir
copr-manager
```

## Notas del icono provisional

- Se usa un logo de Fedora como icono provisional para la etapa alpha.
- Archivo actual: data/icons/hicolor/512x512/apps/io.github.gzenit.CoprManager.png
