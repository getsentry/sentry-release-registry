
import pytest


def test_caching_disabled(client):
    assert client.application.config['CACHE_ENABLED'] is False


def test_route_root_not_found(client):
    response = client.get('/')

    assert response.status_code == 404


@pytest.mark.parametrize(
    "sdks_url",
    [
        '/sdks',
        '/sdks?strict=1',
    ],
    ids=["non_strict", "strict"]
)
def test_route_sdks(client, sdks_url):
    response = client.get(sdks_url)

    assert response.status_code == 200
    data = response.get_json()
    assert data['sentry.python']['canonical'] == 'pypi:sentry-sdk'


def test_routes_sdk_single_latest(client):
    response = client.get('/sdks/sentry.python/latest')

    assert response.status_code == 200
    data = response.get_json()
    assert data['canonical'] == 'pypi:sentry-sdk'


@pytest.mark.parametrize(
    "packages_url",
    [
        '/packages',
        '/packages?strict=1',
    ],
    ids=["non_strict", "strict"]
)
def test_route_packages(client, packages_url):
    response = client.get(packages_url)

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
