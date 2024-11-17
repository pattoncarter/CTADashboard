#!/bin/bash
# install-dashboard.sh

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nodejs npm chromium-browser xserver-xorg x11-xserver-utils unclutter

# Install PM2 globally
sudo npm install -y pm2 -g

# Create dashboard directory
mkdir -p ~/cta-dashboard
cd ~/cta-dashboard

# Create startup script
cat > ~/cta-dashboard/start-dashboard.sh << 'EOL'
#!/bin/bash
# Wait for network
until ping -c1 google.com >/dev/null 2>&1; do sleep 2; done

# Start the server
cd /home/pi/cta-dashboard
pm2 start server.js

# Wait for server to be ready
sleep 10

# Start Chromium in kiosk mode
chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3000 --start-fullscreen --start-maximized
EOL

# Make startup script executable
chmod +x ~/cta-dashboard/start-dashboard.sh

# Create autostart directory and file
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/dashboard.desktop << 'EOL'
[Desktop Entry]
Type=Application
Name=CTA Dashboard
Exec=/home/pi/cta-dashboard/start-dashboard.sh
X-GNOME-Autostart-enabled=true
EOL

# Disable screen sleep
cat > ~/.config/autostart/disable-sleep.desktop << 'EOL'
[Desktop Entry]
Type=Application
Name=Disable Sleep
Exec=xset s off -dpms
X-GNOME-Autostart-enabled=true
EOL

# Install project dependencies
npm init -y
npm install express cors axios dotenv express-rate-limit
