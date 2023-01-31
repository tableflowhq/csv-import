#!/bin/bash

cd ~/ || (echo 'Failed to navigate to ~/' && exit)
sudo yum install git || (echo 'Failed to install git ~/' && exit)
sudo yum install golang || (echo 'Failed to install goland ~/' && exit)
git clone https://github.com/PortolaLabs/pg_auto_trigger.git
cd pg_auto_trigger || (echo 'Failed to install or navigate to ~/pg_auto_trigger' && exit)
chmod +x deploy.sh
cp -n env.example .env
# Prompt user to modify file then show instructions on how to run it?
nano .env
