#!/bin/bash

cd "$HOME" || (echo 'Failed to navigate to home dir' && exit)
sudo yum install git -y || (echo 'Failed to install git ' && exit)
sudo yum install golang -y || (echo 'Failed to install golang' && exit)

git clone https://github.com/portola-labs/db-webhooks.git
cd db-webhooks || (echo 'Failed to install or navigate to db-webhooks' && exit)

# Prompt user to modify file then show instructions on how to run it?
cp -n env.example .env && nano .env

# Build the executable
cd "$HOME"/db-webhooks/go/services/event_listener || exit
go build -o "$HOME"/db-webhooks || exit
cd "$HOME"/ || exit
chmod +x "$HOME"/db-webhooks/event_listener || exit

if [ ! -f /etc/systemd/system/db-webhooks.service ]
then
    # Create a service to run the app
    (echo 'Description=PG Auto Trigger'
    echo ''
    echo 'Wants=network.target'
    echo 'After=syslog.target network-online.target'
    echo ''
    echo '[Service]'
    echo 'Type=simple'
    echo 'ExecStart='"$HOME"'/db-webhooks/event_listener'
    echo 'EnvironmentFile='"$HOME"'/db-webhooks/.env'
    echo 'Restart=on-failure'
    echo 'RestartSec=10'
    echo 'KillMode=process'
    echo ''
    echo '[Install]'
    echo 'WantedBy=multi-user.target') | sudo tee -a /etc/systemd/system/db-webhooks.service >/dev/null
    # Enable the service
    sudo systemctl daemon-reload || exit
    sudo systemctl enable db-webhooks || exit
fi

# Start the service
sudo systemctl start db-webhooks || (echo 'Failed to start the service' && exit)
echo 'service db-webhooks created and started!'
echo 'view logs:    journalctl --unit=db-webhooks.service -n 32 --no-pager -f'
echo 'view status:  sudo systemctl status db-webhooks'
echo 'restart:      sudo systemctl restart db-webhooks'
printf '\n\n'

# Generate the trigger creation SQL
echo '**** This will just generate the SQL that you will need to execute manually! ****'
printf '\n'
echo 'Provide the table name you want to generate the trigger on'
read -r -p 'Table name: ' tablename
printf '\n\n'
printf "
do
\$$
    begin
        if not exists(select 1 from pg_proc where proname = 'trigger_notify_%s') then
            create or replace function trigger_notify_%s() returns trigger as
            \$FN$
            declare
                payload jsonb;
            begin
                payload = jsonb_build_object(
                        'table', '%s',
                        'op', to_jsonb(TG_OP),
                        'data', to_jsonb(NEW)
                    );
                perform pg_notify('pg_notify_trigger_event', payload::text);
                return NEW;
            end;
            \$FN$ language plpgsql;
        end if;
        if not exists(select 1 from pg_trigger where tgname = 'trigger_notify_%s_insert') then
            create trigger trigger_notify_%s_insert
                after insert
                on %s
                for each row
            execute procedure trigger_notify_%s();
        end if;
    end
\$$;
" "$tablename" "$tablename" "$tablename" "$tablename" "$tablename" "$tablename" "$tablename"
echo
printf '\n\n'

# Restart service
#sudo systemctl restart db-webhooks
# Check service status
#sudo systemctl status db-webhooks

# Remove the service completely
sudo systemctl stop db-webhooks; \
sudo systemctl disable db-webhooks; \
sudo rm /etc/systemd/system/db-webhooks.service; \
sudo rm /usr/lib/systemd/system/db-webhooks; \
sudo rm /usr/lib/systemd/system/db-webhooks; \
sudo systemctl daemon-reload; \
sudo systemctl reset-failed; \
echo 'service removed';

# Logs for the service
#journalctl --unit=db-webhooks.service -n 32 --no-pager -f
