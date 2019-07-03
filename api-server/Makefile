develop:
	pip install --editable '.[tests]'

run:
	FLASK_APP=./apiserver.py FLASK_ENV=development flask run

test:
	pytest

lint:
	flake8

clean:
	find . -name \*.pyc -delete
