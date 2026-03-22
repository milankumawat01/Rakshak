#!/bin/bash
# Quick deploy: pull latest code, rebuild, restart
# Run as: ssh ubuntu@152.67.14.19 'bash /home/ubuntu/Rakshak/deploy/deploy.sh'

set -e
cd /home/ubuntu/Rakshak

echo "=== Pulling latest code ==="
git pull origin master

echo "=== Updating backend dependencies ==="
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate
cd ..

echo "=== Rebuilding frontend ==="
cd frontend
npm install --silent
npm run build
cd ..

echo "=== Restarting services ==="
sudo systemctl restart rakshak
sudo systemctl reload nginx

echo "✅ Deploy complete! Site: http://152.67.14.19"
