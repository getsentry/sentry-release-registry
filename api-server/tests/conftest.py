import os

import pytest


def get_client():
    from apiserver import app, is_caching_enabled

    app.config['TESTING'] = True
    app.enable_cache(is_caching_enabled())
    return app.test_client()


@pytest.fixture
def client():
    os.environ['FLASK_ENV'] = 'testing'

    yield get_client()


@pytest.fixture
def client_with_caching():
    os.environ['FLASK_ENV'] = 'production'

    yield get_client()
