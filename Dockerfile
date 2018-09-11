FROM python:3.7.0-slim

RUN apt-get update \
  && apt-get install -y build-essential git gosu \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV \
  FLASK_APP=./apiserver.py\
  FLASK_ENV=production

ENV \
  REGISTRY_UID=10011 \
  REGISTRY_GID=10011

# Create a new user and group with fixed uid/gid
RUN groupadd --system registry --gid $REGISTRY_GID \
  && useradd --system --gid registry --uid $REGISTRY_UID registry

WORKDIR /usr/src/app

COPY ./api-server/*.py ./

RUN pip install uwsgi==2.0.17.1 && pip install .

RUN flask update-repo

RUN chown -R registry:registry ./

COPY ./docker-entrypoint.sh /docker-entrypoint.sh

EXPOSE 5030

ENTRYPOINT ["/docker-entrypoint.sh"]
