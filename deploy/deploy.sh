#!/bin/bash
# Quick deploy: pull, rebuild, restart
# Run on server: bash /home/ubuntu/Rakshak/deploy/deploy.sh

set -e
cd /home/ubuntu/Rakshak

echo "=== Pulling latest ==="
git pull origin master

echo "=== Backend deps ==="
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate
cd ..

echo "=== Frontend build ==="
cd frontend
npm install --silent
npm run build
cd ..

echo "=== Restart ==="
pm2 restart rakshak

echo "✅ Live at http://152.67.14.19:8000"
