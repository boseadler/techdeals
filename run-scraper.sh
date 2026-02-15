#!/bin/bash
# TechDeals scraper runner

cd ~/clawd/techdeals

echo "🚀 Running scraper..."
node scraper.js

if [ $? -eq 0 ]; then
  echo "✅ Scraper done, committing..."
  git add deals.json
  git commit -m "Auto-update deals $(date '+%Y-%m-%d %H:%M')"
  git push origin main
  echo "✅ Pushed to GitHub!"
else
  echo "❌ Scraper failed"
fi
