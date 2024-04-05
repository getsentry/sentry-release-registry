# sentry-release-registry-apiserver

This is a minimal web service that gives better access to the data
contained in this repository.

## Installation

```sh
python -m venv .venv
source .venv/bin/activate

pip install --editable .
```

## Run the server

Locally you can use flask run for it:

```sh
export FLASK_APP=./apiserver.py
export FLASK_ENV=development
flask run
```

For production use export `FLASK_ENV=production` instead.
