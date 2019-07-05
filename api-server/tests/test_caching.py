from unittest import mock


def test_caching_enabled(client_with_caching):
    assert client_with_caching.application.config['CACHE_ENABLED'] is True


def test_caching_root_not_found(client_with_caching):
    response = client_with_caching.get('/')

    assert response.status_code == 404
    assert response.headers.get('X-From-Cache') is None

    response = client_with_caching.get('/')

    assert response.status_code == 404
    assert response.headers.get('X-From-Cache') == '1'


def test_caching_all_sdks(client_with_caching):
    from apiserver import registry
    sdk_endpoint = '/sdks'

    with mock.patch('apiserver.Registry.get_sdks', wraps=registry.get_sdks) as mock_get_sdk_summary:
        assert mock_get_sdk_summary.call_count == 0

        response1 = client_with_caching.get(sdk_endpoint)

        assert response1.status_code == 200
        assert response1.headers.get('X-From-Cache') is None
        assert mock_get_sdk_summary.call_count == 1

        response2 = client_with_caching.get(sdk_endpoint)

        assert mock_get_sdk_summary.call_count == 1
        assert response2.status_code == 200
        assert response2.headers.get('X-From-Cache') == '1'

    data1 = response1.get_json()
    data2 = response2.get_json()
    assert data1 == data2
    assert data1['sentry.python']['canonical'] == 'pypi:sentry-sdk'
