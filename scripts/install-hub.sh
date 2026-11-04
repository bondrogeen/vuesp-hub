#!/usr/bin/env bash
#
# Install or upgrade the headless Vuesp hub as a systemd service.
#
#   sudo ./scripts/install-hub.sh                       # newest release/vuesp-hub-*.tgz
#   sudo ./scripts/install-hub.sh --tarball ./release/vuesp-hub-1.0.0.tgz
#   sudo ./scripts/install-hub.sh --no-start            # install without starting
#
# The script is idempotent: run it again with a newer tarball to upgrade.
set -euo pipefail

original_args="$*"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"

prefix="/opt/vuesp-hub"
data_dir="/var/lib/vuesp-hub"
config_dir="/etc/vuesp-hub"
service_user="vuesp"
tarball=""
install_service=1
start_service=1
print_unit=0

usage() {
  cat <<'EOF'
Usage: install-hub.sh [options]

Options:
  --tarball <path>    vuesp-hub npm tarball (default: newest release/vuesp-hub-*.tgz)
  --prefix <path>     install prefix (default: /opt/vuesp-hub)
  --data-dir <path>   data directory (default: /var/lib/vuesp-hub)
  --config-dir <path> config directory (default: /etc/vuesp-hub)
  --user <name>       service user (default: vuesp)
  --no-service        skip systemd unit installation
  --no-start          install the unit but do not enable/start it
  --print-unit        print the rendered systemd unit and exit (no root needed)
  -h, --help          show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tarball) tarball="${2:?--tarball needs a path}"; shift 2 ;;
    --prefix) prefix="${2:?--prefix needs a path}"; shift 2 ;;
    --data-dir) data_dir="${2:?--data-dir needs a path}"; shift 2 ;;
    --config-dir) config_dir="${2:?--config-dir needs a path}"; shift 2 ;;
    --user) service_user="${2:?--user needs a name}"; shift 2 ;;
    --no-service) install_service=0; shift ;;
    --no-start) start_service=0; shift ;;
    --print-unit) print_unit=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[WARN]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

command -v node >/dev/null || die "node is not installed (need >= 22.13.0)"
command -v npm >/dev/null || die "npm is not installed"

node_bin="$(command -v node)"
node_version="$(node -p 'process.versions.node')"
node_major="${node_version%%.*}"
if (( node_major < 22 )); then
  die "node $node_version found, but vuesp-hub needs >= 22.13.0"
fi

detect_serial_group() {
  local candidate
  for candidate in dialout uucp; do
    if getent group "$candidate" >/dev/null 2>&1; then
      echo "$candidate"
      return
    fi
  done
  echo ""
}

render_unit() {
  local supplementary
  supplementary="$(detect_serial_group)"
  if [[ -n "$supplementary" ]]; then
    supplementary="SupplementaryGroups=$supplementary"
  else
    supplementary="# No dialout/uucp group found; add serial access manually."
  fi

  sed \
    -e "s|__NODE__|$node_bin|g" \
    -e "s|__PREFIX__|$prefix|g" \
    -e "s|__USER__|$service_user|g" \
    -e "s|__CONFIG_DIR__|$config_dir|g" \
    -e "s|__DATA_DIR__|$data_dir|g" \
    -e "s|__SUPPLEMENTARY_GROUPS__|$supplementary|g" \
    "$repo_root/packaging/systemd/vuesp-hub.service"
}

if (( print_unit )); then
  render_unit
  exit 0
fi

[[ "${EUID}" -eq 0 ]] || die "run as root: sudo $0 $original_args"

case "$node_bin" in
  /home/*|/root/*)
    warn "node lives at $node_bin; the systemd unit sets ProtectHome=true, so the service will not see it."
    warn "install Node.js system-wide (e.g. /usr/bin/node) before starting the service."
    ;;
esac

if [[ -z "$tarball" ]]; then
  tarball="$(ls -1 "$repo_root"/release/vuesp-hub-*.tgz 2>/dev/null | sort -V | tail -n 1 || true)"
  [[ -n "$tarball" ]] || die "no tarball found; run 'npm run pack:hub' or pass --tarball <path>"
fi
[[ -f "$tarball" ]] || die "tarball not found: $tarball"
tarball="$(cd -- "$(dirname -- "$tarball")" && pwd)/$(basename -- "$tarball")"

log "Installing $tarball to $prefix"

# Service account ------------------------------------------------------------
if ! id -u "$service_user" >/dev/null 2>&1; then
  log "Creating system user $service_user"
  useradd --system --user-group --home-dir "$data_dir" --shell /usr/sbin/nologin "$service_user"
fi
service_group="$(id -gn "$service_user")"

# Package --------------------------------------------------------------------
install -d -m 0755 "$prefix"
npm install --global --prefix "$prefix" --no-audit --no-fund --loglevel=error "$tarball"
[[ -x "$prefix/bin/vuesp-hub" ]] || die "vuesp-hub binary missing after install: $prefix/bin/vuesp-hub"

# Directories ----------------------------------------------------------------
log "Preparing data ($data_dir) and config ($config_dir)"
install -d -m 0700 -o "$service_user" -g "$service_group" "$data_dir"
install -d -m 0750 -o root -g "$service_group" "$config_dir"

# Environment file -----------------------------------------------------------
env_file="$config_dir/hub.env"
if [[ ! -f "$env_file" ]]; then
  log "Generating $env_file with a new master key"
  if command -v openssl >/dev/null; then
    secret_key="$(openssl rand -hex 32)"
  else
    secret_key="$(node -p 'require("node:crypto").randomBytes(32).toString("hex")')"
  fi
  sed \
    -e "s|^VUESP_DATA_DIR=.*|VUESP_DATA_DIR=$data_dir|" \
    -e "s|^VUESP_SECRET_KEY=.*|VUESP_SECRET_KEY=$secret_key|" \
    "$repo_root/packaging/systemd/hub.env.example" > "$env_file"
  chown root:"$service_group" "$env_file"
  chmod 0640 "$env_file"
else
  log "Keeping existing $env_file"
  if ! grep -Eq '^VUESP_SECRET_KEY=.+' "$env_file"; then
    warn "VUESP_SECRET_KEY is empty in $env_file: device credentials cannot be saved."
  fi
fi

# systemd unit ---------------------------------------------------------------
if (( install_service )); then
  unit_path="/etc/systemd/system/vuesp-hub.service"
  log "Installing $unit_path"
  render_unit > "$unit_path"
  chmod 0644 "$unit_path"

  systemctl daemon-reload

  if (( start_service )); then
    systemctl enable vuesp-hub >/dev/null
    if systemctl is-active --quiet vuesp-hub; then
      log "Restarting vuesp-hub"
      systemctl restart vuesp-hub
    else
      log "Starting vuesp-hub"
      systemctl start vuesp-hub
    fi
  else
    warn "Service installed but not enabled. Start it with: systemctl enable --now vuesp-hub"
  fi
fi

port="$(grep -E '^VUESP_PORT=' "$env_file" 2>/dev/null | tail -n1 | cut -d= -f2 || true)"
host="$(grep -E '^VUESP_HOST=' "$env_file" 2>/dev/null | tail -n1 | cut -d= -f2 || true)"

cat <<EOF

Installed vuesp-hub.

  Binary:  $prefix/bin/vuesp-hub
  Config:  $env_file
  Data:    $data_dir
  URL:     http://${host:-127.0.0.1}:${port:-3005}
  Logs:    journalctl -u vuesp-hub -f

EOF

if (( install_service && start_service )); then
  systemctl --no-pager --lines=0 status vuesp-hub || true
fi
