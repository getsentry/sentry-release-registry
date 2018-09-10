# sentry-release-registry-apiserver

This is a minimal web service that gives better access to the data
contained in this repository.

## Installation

```
virtualenv -ppython3 .venv
. .venv/bin/activate
pip install --editable .
```

## Fetching the Repo

This needs to be done once to have it work at all.  It checks out a git
repo into the `.registry` folder next to the apiserver.py file.

```
export FLASK_APP=./apiserver.py
export FLASK_ENV=development
flask update-repo
```

For production use export `FLASK_ENV=production` instead.  This should be
run once every minute to update the data.

## Run the server

Locally you can use flask run for it:

```
export FLASK_APP=./apiserver.py
export FLASK_ENV=development
flask run
```
