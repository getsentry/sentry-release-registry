from setuptools import find_packages, setup


def get_requirements(env):
    with open(u'requirements-{}.txt'.format(env)) as fp:
        return [x.strip() for x in fp.read().split('\n') if not x.startswith('#')]


install_requires = get_requirements('base')
tests_require = get_requirements('test')

setup(
    name='sentry-release-registry-apiserver',
    version='1.0.0',
    url='https://github.com/getsentry/sentry-release-registry',
    license='Apache2',
    description='API server for the release registry',
    py_modules=['apiserver'],
    zip_safe=False,
    install_requires=install_requires,
    extras_require={
        'tests': tests_require,
    },
)
