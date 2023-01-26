FROM python:3.7-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential gosu \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV PIP_NO_CACHE_DIR off
ENV PIP_DISABLE_PIP_VERSION_CHECK on

ENV \
  FLASK_APP=./apiserver.py \
  FLASK_ENV=production

ENV \
  REGISTRY_UID=10011 \
  REGISTRY_GID=10011

# Create a new user and group with fixed uid/gid
RUN groupadd --system registry --gid $REGISTRY_GID \
  && useradd --system --gid registry --uid $REGISTRY_UID registry

WORKDIR /work

# Copy and install the server first
COPY api-server/requirements*.txt api-server/setup.py api-server/

RUN cd api-server && pip install -e .

COPY . .

RUN chown -R registry:registry ./

COPY ./docker-entrypoint.sh /docker-entrypoint.sh

# Smoke test
RUN flask --version && flask routes

EXPOSE 5030

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD [ "mywsgi", "apiserver:app", "0.0.0.0:5030" ]
