#!/bin/bash
PROJECT_DIR="/home/teracrow/dynamic-island-linux"
LOG_FILE="$HOME/dynamic-island-startup.log"

echo "--- Startup at $(date) ---" >> "$LOG_FILE"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Directory $PROJECT_DIR not found" >> "$LOG_FILE"
  exit 1
fi

cd "$PROJECT_DIR"
export PATH=$PATH:/usr/bin:/usr/local/bin

echo "Running npm start..." >> "$LOG_FILE"
/usr/bin/npm start >> "$LOG_FILE" 2>&1
