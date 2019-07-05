

def test_route_root_not_found(client):
    response = client.get('/')

    assert response.status_code == 404


def test_route_sdks(client):
    response = client.get('/sdks')

    assert response.status_code == 200
    data = response.get_json()
    assert data['sentry.python']['canonical'] == 'pypi:sentry-sdk'


def test_routes_sdk_single_latest(client):
    response = client.get('/sdks/sentry.python/latest')

    assert response.status_code == 200
    data = response.get_json()
    assert data['canonical'] == 'pypi:sentry-sdk'


def test_route_packages(client):
    response = client.get('/packages')

    assert response.status_code == 200
    data = response.get_json()
    assert data['pypi:sentry-sdk']['canonical'] == 'pypi:sentry-sdk'


def test_route_apps(client):
    response = client.get('/apps')

    assert response.status_code == 200
    data = response.get_json()
    assert data['sentry-cli']


def test_route_marketing_slugs(client):
    response = client.get('/marketing-slugs')

    assert response.status_code == 200
    data = response.get_json()
    assert 'browser' in data['slugs']


def test_healthcheck(client):
    response = client.get('/healthz')

    assert response.status_code == 200
    assert response.data == b'ok\n'
