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
sudo systemctl start pg_auto_trigger || (echo 'Failed to start the service' && exit)
echo 'service pg_auto_trigger created and started!'
echo 'view logs:    journalctl --unit=pg_auto_trigger.service -n 32 --no-pager -f'
echo 'view status:  sudo systemctl status pg_auto_trigger'
echo 'restart:      sudo systemctl restart pg_auto_trigger'
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
#journalctl --unit=pg_auto_trigger.service -n 32 --no-pager -f
