#!/bin/bash

cd "$HOME" || (echo 'Failed to navigate to home dir' && exit)
sudo yum install git -y || (echo 'Failed to install git ' && exit)
sudo yum install golang -y || (echo 'Failed to install golang' && exit)

git clone https://github.com/PortolaLabs/pg_auto_trigger.git
cd pg_auto_trigger || (echo 'Failed to install or navigate to pg_auto_trigger' && exit)

# Prompt user to modify file then show instructions on how to run it?
cp -n env.example .env && nano .env

# Build the executable
cd "$HOME"/pg_auto_trigger/go/services/event_listener || exit
go build -o "$HOME"/pg_auto_trigger || exit
cd "$HOME"/ || exit
chmod +x "$HOME"/pg_auto_trigger/event_listener || exit

if [ ! -f /etc/systemd/system/pg_auto_trigger.service ]
then
    # Create a service to run the app
    (echo 'Description=PG Auto Trigger'
    echo ''
    echo 'Wants=network.target'
    echo 'After=syslog.target network-online.target'
    echo ''
    echo '[Service]'
    echo 'Type=simple'
    echo 'ExecStart='"$HOME"'/pg_auto_trigger/event_listener'
    echo 'EnvironmentFile='"$HOME"'/pg_auto_trigger/.env'
    echo 'Restart=on-failure'
    echo 'RestartSec=10'
    echo 'KillMode=process'
    echo ''
    echo '[Install]'
    echo 'WantedBy=multi-user.target') | sudo tee -a /etc/systemd/system/pg_auto_trigger.service >/dev/null
    # Enable the service
    sudo systemctl daemon-reload || exit
    sudo systemctl enable pg_auto_trigger || exit
fi

# Start the service
sudo systemctl start pg_auto_trigger || exit

# Restart service
#sudo systemctl restart pg_auto_trigger
# Check service status
#sudo systemctl status pg_auto_trigger

# Remove the service completely
#sudo systemctl stop pg_auto_trigger; \
#sudo systemctl disable pg_auto_trigger; \
#sudo rm /etc/systemd/system/pg_auto_trigger.service; \
#sudo rm /usr/lib/systemd/system/pg_auto_trigger; \
#sudo rm /usr/lib/systemd/system/pg_auto_trigger; \
#sudo systemctl daemon-reload; \
#sudo systemctl reset-failed; \
#echo 'service removed';

# Logs for the service
#journalctl --unit=pg_auto_trigger.service -n 100 --no-pager
