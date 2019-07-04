import os

import pytest


@pytest.fixture
def client():
    os.environ['FLASK_ENV'] = 'testing'

    from apiserver import app

    app.config['TESTING'] = True
    client = app.test_client()
    yield client
