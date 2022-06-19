#!/bin/bash

# adapted from
# https://github.com/equinix-labs/otel-cli/blob/0ca9733e63e8cc20bdab834063a8e2f00dff57b7/demos/15span-background-layered.sh

set -e
set -x

TRACE_ID=$(cat /dev/urandom | env LC_ALL=C tr -dc 'a-f1-9' | fold -w 32 | head -n 1)
PARENT_ID=$(cat /dev/urandom | env LC_ALL=C tr -dc 'a-f1-9' | fold -w 16 | head -n 1)

export TRACEPARENT="00-$TRACE_ID-$PARENT_ID-01"
export CI=1

carrier=$(mktemp)

otel-cli exec \
  --service "yarn.build" \
  --name "hammer the server for sweet sweet data" \
  --kind "client" \
  \
  "otel-cli exec --service 'yarn.build' --name 'build all' --kind 'client'   --tp-export \"yarn build:plugin && CI=true yarn build -r -A --verbose\"" # --tp-carrier $carrier \
