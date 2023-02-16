#!/bin/sh

IP=$(curl http://checkip.amazonaws.com)
echo "REACT_APP_API_URL=http://$IP:3003/api/v1/" >> .env