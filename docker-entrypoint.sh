#!/bin/bash
set -e

if [ "$1" = 'mywsgi' ]; then
  set -- gosu registry "$@"
fi

exec "$@"
