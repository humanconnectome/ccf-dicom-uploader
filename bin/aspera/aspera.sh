#!/bin/bash

HOSTNAME=${1}
PROJECT=${2}
SESSION=${3}
DIRECTORY=${4}
INBOX=${5}
RSAKEY=${6}
LOGDIR=${7}
PLATFORM=${8}

# aspera/nix/ascp -v -DDD -P 33001 -l 10G -k 2 -d -L $LOGDIR -R /tmp/ \
aspera/$PLATFORM/ascp -v -P 33001 -l 10G -k 2 -d -L $LOGDIR \
  -i "$RSAKEY"  \
  "$DIRECTORY" ccfxfer@$HOSTNAME:/$PROJECT/$SESSION
  # "$DIRECTORY" ccfxfer@$HOSTNAME:/$PROJECT/$TIMESTAMP
  # "$DIRECTORY" ccfxfer@$HOSTNAME:$INBOX/$PROJECT
