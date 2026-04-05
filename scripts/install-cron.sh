#!/bin/bash

# Install Automated Tests Cron Job
# This script sets up automatic testing every hour

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

echo "🚀 Installing Automated Tests Cron Job"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create logs directory
mkdir -p "$LOG_DIR"
echo "✅ Created logs directory: $LOG_DIR"

# Create cron job entry
CRON_ENTRY="0 * * * * cd $PROJECT_DIR && npx ts-node scripts/run-automated-tests.ts >> $LOG_DIR/tests.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "run-automated-tests.ts"; then
    echo "ℹ️  Cron job already installed"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    echo "✅ Cron job installed:"
    echo "   Schedule: Every hour (0 * * * *)"
    echo "   Command: $PROJECT_DIR/scripts/run-automated-tests.ts"
    echo "   Logs: $LOG_DIR/tests.log"
fi

echo ""
echo "📋 Current crontab entries for this project:"
crontab -l 2>/dev/null | grep "careapp\|run-automated-tests" || echo "   (No entries found)"

echo ""
echo "🎯 To view live logs:"
echo "   tail -f $LOG_DIR/tests.log"

echo ""
echo "🔧 To remove the cron job later:"
echo "   crontab -e  # then remove the line with 'run-automated-tests.ts'"

echo ""
echo "✅ Installation complete!"
