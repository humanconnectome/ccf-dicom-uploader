#!/bin/bash

HOSTNAME=${1}
PROJECT=${2}
DIRECTORY=${3}
INBOX=${4}
RSAKEY=${5}

rsync -avh --progress -e "ssh -i \"$RSAKEY\"" --perms \
  "$DIRECTORY" ccfxfer@$HOSTNAME:$INBOX/$PROJECT
