# COPR Manager

COPR Manager es una app en GTK 4 + Libadwaita (GJS) para ver tus repos COPR instalados en formato de tarjetas.

## Estado

- Version: Alpha 1.0.0
- Funciones disponibles en esta version:
  - Listar repos COPR detectados en el sistema.
  - Mostrar en tarjetas: desarrollador, nombre de paquete/proyecto, version detectada, estado del repo y repoid.
  - Botones visibles para Activar, Desactivar y Eliminar (aun no implementados).

## Requisitos

- gjs
- gtk4-devel
- libadwaita-devel
- meson
- ninja-build

## Ejecutar en desarrollo

Desde la raiz del proyecto:

```bash
gjs -m src/main.js
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
