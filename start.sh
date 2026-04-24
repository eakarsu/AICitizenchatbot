#!/bin/bash

# =============================================================================
# County Government AI Citizen Chatbot - Startup Script
# =============================================================================
# This script:
# 1. Kills any processes on ports 3000 and 3001
# 2. Creates/resets the PostgreSQL database
# 3. Seeds the database with sample data (15+ items per feature)
# 4. Installs dependencies
# 5. Starts backend with auto-reload (nodemon)
# 6. Starts frontend with hot-reload (react-scripts)
# =============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          🏛️  County Government AI Citizen Chatbot           ║"
echo "║                    Startup Script                           ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Frontend: http://localhost:3000                            ║"
echo "║  Backend:  http://localhost:3001                            ║"
echo "║  Login:    admin@county.gov / admin123                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ---------------------------------------------------------
# Step 1: Clean up used ports
# ---------------------------------------------------------
echo -e "${YELLOW}[1/6] Cleaning up ports 3000 and 3001...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${RED}Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  else
    echo -e "  ${GREEN}Port $port is free${NC}"
  fi
}

cleanup_port 3000
cleanup_port 3001
sleep 2

# Double-check ports are free
for port in 3000 3001; do
  if lsof -ti :$port >/dev/null 2>&1; then
    echo -e "  ${RED}Port $port still in use, force killing...${NC}"
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
done

# ---------------------------------------------------------
# Step 2: Check PostgreSQL
# ---------------------------------------------------------
echo -e "${YELLOW}[2/6] Checking PostgreSQL...${NC}"

if ! command -v psql &> /dev/null; then
  echo -e "${RED}PostgreSQL is not installed. Please install it first.${NC}"
  echo "  brew install postgresql@16 && brew services start postgresql@16"
  exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || {
    echo -e "${RED}Could not start PostgreSQL. Please start it manually.${NC}"
    exit 1
  }
  sleep 2
fi

echo -e "  ${GREEN}PostgreSQL is running${NC}"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

DB_NAME="${DB_NAME:-citizen_chatbot}"
DB_USER="${DB_USER:-postgres}"

# Create database if it doesn't exist
echo -e "  Creating database '${DB_NAME}'..."
createdb "$DB_NAME" 2>/dev/null || echo -e "  ${GREEN}Database already exists${NC}"

# ---------------------------------------------------------
# Step 3: Install dependencies
# ---------------------------------------------------------
echo -e "${YELLOW}[3/6] Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}Backend dependencies installed${NC}"

echo -e "${YELLOW}[4/6] Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}Frontend dependencies installed${NC}"

# ---------------------------------------------------------
# Step 4: Seed database
# ---------------------------------------------------------
echo -e "${YELLOW}[5/6] Seeding database with sample data...${NC}"
cd "$BACKEND_DIR"
node seed.js
echo -e "  ${GREEN}Database seeded successfully${NC}"

# ---------------------------------------------------------
# Step 5: Start servers
# ---------------------------------------------------------
echo -e "${YELLOW}[6/6] Starting servers with auto-reload...${NC}"

# Function to handle cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down servers...${NC}"
  cleanup_port 3000
  cleanup_port 3001
  echo -e "${GREEN}Servers stopped. Goodbye!${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend with nodemon (auto-reload on code changes)
echo -e "  ${CYAN}Starting backend on port 3001 (with nodemon auto-reload)...${NC}"
cd "$BACKEND_DIR"
npx nodemon server.js &
BACKEND_PID=$!
sleep 2

# Start frontend (React dev server with hot-reload)
echo -e "  ${CYAN}Starting frontend on port 3000 (with hot-reload)...${NC}"
cd "$FRONTEND_DIR"
BROWSER=none PORT=3000 npm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               All services are starting!                    ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  Frontend: http://localhost:3000                            ║${NC}"
echo -e "${GREEN}║  Backend:  http://localhost:3001                            ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  Login Credentials:                                        ║${NC}"
echo -e "${GREEN}║    Email:    admin@county.gov                               ║${NC}"
echo -e "${GREEN}║    Password: admin123                                       ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop all services                         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
