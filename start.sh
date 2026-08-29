#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# FEAR TubeStudio — Unified Start Script
# Usage:
#   ./start.sh          → Development mode (hot-reload, Vite dev server)
#   ./start.sh --prod   → Production mode  (pnpm build + serve static dist)
#   ./start.sh --help   → Show help
# ─────────────────────────────────────────────────────────────────────────────
set -e

export PATH="$HOME/.local/bin:$PATH"

# ── Argument Parsing ──────────────────────────────────────────────────────────
MODE="dev"
for arg in "$@"; do
  case $arg in
    --prod|--production) MODE="prod" ;;
    --help|-h)
      echo ""
      echo "  FEAR TubeStudio — Start Script"
      echo ""
      echo "  Usage:"
      echo "    ./start.sh           Development mode (Vite hot-reload)"
      echo "    ./start.sh --prod    Production mode  (built static files)"
      echo ""
      exit 0
      ;;
  esac
done

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════════════════════════╗"
if [ "$MODE" = "prod" ]; then
  echo "  ║   🚀 FEAR TubeStudio  —  PRODUCTION MODE               ║"
else
  echo "  ║   ⚡ FEAR TubeStudio  —  DEVELOPMENT MODE              ║"
fi
echo "  ╚══════════════════════════════════════════════════════════╝"
echo "  Team FEAR · dev by srymc"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Dependency Checks ─────────────────────────────────────────────────────────
if ! command -v uv &> /dev/null; then
    echo "  ❌ uv not found. Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "  ❌ pnpm not found. Install: npm install -g pnpm"
    exit 1
fi

# ── Kill any existing instances on ports 8000 / 5173 ─────────────────────────
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# ── Trap cleanup ──────────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "  🛑 Shutting down FEAR TubeStudio..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  lsof -ti:8000 | xargs kill -9 2>/dev/null || true
  lsof -ti:5173 | xargs kill -9 2>/dev/null || true
  echo "  ✅ Stopped. Goodbye!"
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# ── 1. Start Backend ──────────────────────────────────────────────────────────
echo "  [1/2] 🔧 Starting FastAPI backend on http://localhost:8000 ..."
cd "$SCRIPT_DIR/backend"
uv run python run.py &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait up to 8s for backend to be healthy
for i in $(seq 1 8); do
  sleep 1
  if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "  ✅ Backend online (pid $BACKEND_PID)"
    break
  fi
  if [ $i -eq 8 ]; then
    echo "  ⚠️  Backend slow to start — continuing anyway..."
  fi
done

# ── 2. Start Frontend ─────────────────────────────────────────────────────────
cd "$SCRIPT_DIR/frontend"

if [ "$MODE" = "prod" ]; then
  echo "  [2/2] 🏗️  Building frontend for production..."
  pnpm build

  # Check if 'serve' is available, otherwise use python http.server as fallback
  if command -v serve &> /dev/null; then
    echo "  🌐 Serving dist/ on http://localhost:5173 (serve)"
    serve dist -p 5173 -s &
    FRONTEND_PID=$!
  elif command -v python3 &> /dev/null; then
    echo "  🌐 Serving dist/ on http://localhost:5173 (python3 http.server)"
    cd dist && python3 -m http.server 5173 &
    FRONTEND_PID=$!
    cd ..
  else
    echo "  ❌ No static file server found. Install 'serve': npm i -g serve"
    exit 1
  fi

  echo ""
  echo "  ╔══════════════════════════════════════════════════╗"
  echo "  ║  ✅ PRODUCTION BUILD RUNNING                    ║"
  echo "  ║  🌐 Frontend : http://localhost:5173            ║"
  echo "  ║  🔧 Backend  : http://localhost:8000            ║"
  echo "  ║  📖 API Docs : http://localhost:8000/docs       ║"
  echo "  ╚══════════════════════════════════════════════════╝"
  echo ""
  wait "$FRONTEND_PID"

else
  echo "  [2/2] 🌐 Starting Vite dev server on http://localhost:5173 ..."
  echo ""
  echo "  ╔══════════════════════════════════════════════════╗"
  echo "  ║  ✅ DEVELOPMENT SERVER RUNNING                  ║"
  echo "  ║  🌐 Frontend : http://localhost:5173            ║"
  echo "  ║  🔧 Backend  : http://localhost:8000            ║"
  echo "  ║  📖 API Docs : http://localhost:8000/docs       ║"
  echo "  ║  Press Ctrl+C to stop all services              ║"
  echo "  ╚══════════════════════════════════════════════════╝"
  echo ""
  pnpm dev --host 0.0.0.0 --port 5173
fi
