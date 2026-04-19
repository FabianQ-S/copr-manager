#!/usr/bin/env bash

set -u

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$BASE_DIR/logs"
RUN_DIR="$BASE_DIR/run"
APP_LOG="$LOG_DIR/app.log"
MANAGER_LOG="$LOG_DIR/manager.log"
PID_FILE="$RUN_DIR/copr-manager.pid"
APP_CMD=(gjs -m "$BASE_DIR/src/main.js")

mkdir -p "$LOG_DIR" "$RUN_DIR"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log_info() {
  local msg="$1"
  echo "[$(timestamp)] [INFO] $msg" | tee -a "$MANAGER_LOG"
}

log_warn() {
  local msg="$1"
  echo "[$(timestamp)] [WARN] $msg" | tee -a "$MANAGER_LOG"
}

find_running_pid() {
  pgrep -f "gjs -m $BASE_DIR/src/main.js" | head -n 1 || true
}

is_running() {
  if [[ ! -f "$PID_FILE" ]]; then
    local discovered_pid
    discovered_pid="$(find_running_pid)"
    if [[ -n "$discovered_pid" ]]; then
      echo "$discovered_pid" >"$PID_FILE"
      return 0
    fi
    return 1
  fi

  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"

  if [[ -z "$pid" ]]; then
    return 1
  fi

  if kill -0 "$pid" 2>/dev/null; then
    return 0
  fi

  local discovered_pid
  discovered_pid="$(find_running_pid)"
  if [[ -n "$discovered_pid" ]]; then
    echo "$discovered_pid" >"$PID_FILE"
    return 0
  fi

  return 1
}

start_app() {
  if is_running; then
    local pid
    pid="$(cat "$PID_FILE")"
    log_warn "La app ya esta corriendo con PID $pid"
    exit 0
  fi

  log_info "Iniciando COPR Manager"
  nohup "${APP_CMD[@]}" >>"$APP_LOG" 2>&1 &
  local pid=$!
  echo "$pid" >"$PID_FILE"

  for _ in {1..20}; do
    if kill -0 "$pid" 2>/dev/null; then
      log_info "App iniciada correctamente con PID $pid"
      log_info "Logs de app: $APP_LOG"
      exit 0
    fi

    local discovered_pid
    discovered_pid="$(find_running_pid)"
    if [[ -n "$discovered_pid" ]]; then
      echo "$discovered_pid" >"$PID_FILE"
      log_info "App iniciada correctamente con PID $discovered_pid"
      log_info "Logs de app: $APP_LOG"
      exit 0
    fi

    sleep 0.25
  done

  log_warn "La app no pudo mantenerse en ejecucion. Revisa $APP_LOG"
  if [[ -s "$APP_LOG" ]]; then
    log_warn "Ultimas lineas de app.log:"
    tail -n 20 "$APP_LOG" | sed 's/^/[APP] /' | tee -a "$MANAGER_LOG" >/dev/null
  fi
  rm -f "$PID_FILE"
  exit 1
}

stop_app() {
  if ! is_running; then
    log_warn "No hay una app en ejecucion con PID registrado"
    rm -f "$PID_FILE"
    exit 0
  fi

  local pid
  pid="$(cat "$PID_FILE")"
  log_info "Cerrando app con PID $pid"

  kill "$pid" 2>/dev/null || true

  for _ in {1..10}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PID_FILE"
      log_info "App cerrada correctamente"
      exit 0
    fi
    sleep 0.2
  done

  log_warn "Cierre suave no respondio, forzando cierre"
  kill -9 "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  log_info "App cerrada por fuerza"
}

status_app() {
  if is_running; then
    local pid
    pid="$(cat "$PID_FILE")"
    log_info "Estado: ejecutandose (PID $pid)"
  else
    log_info "Estado: detenida"
  fi
}

show_logs() {
  echo "===== Manager log ====="
  tail -n 50 "$MANAGER_LOG" 2>/dev/null || echo "Sin logs del manager aun"
  echo ""
  echo "===== App log ====="
  tail -n 50 "$APP_LOG" 2>/dev/null || echo "Sin logs de app aun"
}

case "${1:-}" in
  start)
    start_app
    ;;
  stop)
    stop_app
    ;;
  restart)
    stop_app || true
    start_app
    ;;
  status)
    status_app
    ;;
  logs)
    show_logs
    ;;
  *)
    echo "Uso: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
