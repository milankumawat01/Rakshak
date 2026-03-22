#!/bin/bash
# One-time server setup for Rakshak on Ubuntu
# Run as: ssh ubuntu@152.67.14.19 'bash -s' < deploy/setup.sh

set -e

echo "=== Updating system ==="
sudo apt update && sudo apt upgrade -y

echo "=== Installing dependencies ==="
sudo apt install -y python3 python3-pip python3-venv nginx git tesseract-ocr tesseract-ocr-hin nodejs npm

# Install Node 20 via nodesource if needed
if ! node -v 2>/dev/null | grep -q "v2[0-9]"; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "=== Cloning repo ==="
cd /home/ubuntu
if [ ! -d "Rakshak" ]; then
    git clone https://github.com/milankumawat01/Rakshak.git
fi
cd Rakshak

echo "=== Setting up backend ==="
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

echo "=== Building frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Creating .env file (edit with your keys!) ==="
if [ ! -f .env ]; then
    cat > .env << 'ENVEOF'
GEMINI_API_KEY=your_gemini_key_here
SECRET_KEY=your_secret_key_here
UPLOAD_DIR=./uploads
ENVEOF
    echo ">>> IMPORTANT: Edit /home/ubuntu/Rakshak/.env with your actual keys!"
fi

echo "=== Setting up systemd service ==="
sudo cp deploy/rakshak.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable rakshak
sudo systemctl start rakshak

echo "=== Setting up nginx ==="
sudo cp deploy/nginx.conf /etc/nginx/sites-available/rakshak
sudo ln -sf /etc/nginx/sites-available/rakshak /etc/nginx/sites-enabled/rakshak
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "=== Opening firewall ports ==="
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT

echo ""
echo "✅ Rakshak is live at http://152.67.14.19"
echo ">>> Don't forget to edit /home/ubuntu/Rakshak/.env with your API keys!"
echo ">>> Then run: sudo systemctl restart rakshak"
