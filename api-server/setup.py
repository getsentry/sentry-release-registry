from setuptools import find_packages, setup

setup(
    name='sentry-release-registry-apiserver',
    version='1.0.0',
    url='https://github.com/getsentry/sentry-release-registry',
    license='Apache2',
    description='API server for the release registry',
    py_modules=['apiserver'],
    zip_safe=False,
    install_requires=[
        'flask',
        'semver',
    ]
)
