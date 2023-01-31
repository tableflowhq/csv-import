#!/bin/bash

git pull
go run go/services/event_listener/main.go &> output.log &
# TODO: Run as service instead

# pkill -f "go/services/event_listener/main.go"
