#!/bin/bash
set -e

if [ "$1" == 'bash' ]; then
  exec bash
elif [ "$1" == 'run' ]; then
  BASE_CMD="uwsgi --master --manage-script-name --wsgi apiserver:app"
  DEFAULT_ARGS="--socket /tmp/registry.sock --http 0.0.0.0:5030 --workers=2 --max-requests=10000"
  if [ "$#" -gt 1 ]; then
    echo "Running with arguments:" "${@:2}"
    set -- ${BASE_CMD} ${@:2}
  else
    echo "Running with default arguments: ${DEFAULT_ARGS}"
    set -- ${BASE_CMD} ${DEFAULT_ARGS}
  fi

  # Init the registry if the data directory does not exist or empty
  REGISTRY_DIR=".registry"
  if [ ! -d "${REGISTRY_DIR}" ] || [ -z "$(ls -A ${REGISTRY_DIR})" ]; then
    echo 'Fetching the data for the first time...'
    gosu registry flask update-repo
  fi
elif [ "$1" == 'update-repo' ]; then
  set -- flask update-repo
else
  echo 'Commands: run | update-repo'
  exit 1
fi

exec gosu registry "$@"
