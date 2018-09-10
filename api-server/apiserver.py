import os
from flask import Flask, json, abort, jsonify, redirect, url_for
import flask
from semver import VersionInfo
import subprocess


class RegistryJsonEncoder(json.JSONEncoder):

    def default(self, o):
        if hasattr(o, 'to_json'):
            return o.to_json()
        return json.JSONEncoder.default(self, o)


class RegistryFlask(Flask):
    json_encoder = RegistryJsonEncoder

    def make_response(self, result):
        if isinstance(result, ApiResponse):
            return jsonify(result.data)
        return Flask.make_response(self, result)


app = RegistryFlask(__name__)
app.config['REGISTRY_CHECKOUT_PATH'] = '.registry'
app.config['REGISTRY_GIT_URL'] = 'https://github.com/getsentry/sentry-release-registry'
app.config.from_envvar('APISERVER_CONFIG', silent=True)


class InvalidPathComponent(ValueError):
    pass


def validate_path_component(path):
    for item in path.split('/'):
        if item == '.' or item == '..' or not item:
            raise InvalidPathComponent('Invalid path %s' % path)


class ApiResponse(object):

    def __init__(self, data):
        self.data = data


class Git(object):

    def __init__(self, path, remote):
        self.path = path
        self.remote = remote

    def _git(self, args, cwd=None):
        p = subprocess.Popen(['git'] + list(args), cwd=cwd)
        p.wait()

    def init(self):
        if not os.path.exists(self.path):
            self._git(['clone', self.remote, self.path], cwd=None)

    def pull(self):
        self('pull')

    def __call__(self, *args):
        if not os.path.exists(self.path):
            raise RuntimeError('Repo not initialized')
        self._git(args, cwd=self.path)


class SdkInfo(object):

    def __init__(self, registry, data):
        self._registry = registry
        self._data = data

    @property
    def key(self):
        return self._data['key']

    @property
    def name(self):
        return self._data['name']

    def get_main_package(self):
        return self._registry.get_package(self._data['main_package'])

    def iter_packages(self):
        for pkg, version in self._data['packages'].items():
            yield self._registry.get_package(pkg, version=version)

    def to_json(self):
        rv = dict(self._data)
        pkg = self.get_main_package()
        rv['packages'] = packages = {}
        main_package = None
        for pkg in self.iter_packages():
            packages[pkg.canonical] = pkg
            if pkg.canonical == rv['main_package']:
                main_package = pkg
        rv['main_package'] = main_package if main_package else None
        return rv


class PackageInfo(object):

    def __init__(self, registry, data):
        self._registry = registry
        self._data = data

    @property
    def canonical(self):
        return self._data['canonical']

    @property
    def version(self):
        return self._data['version']

    def to_json(self):
        return self._data


class Registry(object):

    def __init__(self):
        self.path = os.path.abspath(app.config['REGISTRY_CHECKOUT_PATH'])
        self.git = Git(self.path, app.config['REGISTRY_GIT_URL'])

    def _path(self, *args):
        for arg in args:
            validate_path_component(arg)
        return os.path.join(self.path, *args)

    def resolve_marketing_slug(self, slug):
        """Given a marketing slug returns the resolved path for it."""
        try:
            rv = os.path.realpath(self._path('marketing-slugs', slug))
            print(rv)
        except OSerror:
            return

        sdk_base = os.path.realpath(self._path('sdks')) + os.path.sep
        if rv.startswith(sdk_base):
            return rv[len(sdk_base):]

    def get_sdk_info(self, key, version='latest'):
        """Returns the SDK info for the given version."""
        try:
            rv = os.path.realpath(self._path('sdks', key, '%s.json' % version))
            with open(rv) as f:
                return SdkInfo(self, json.load(f))
        except (IOError, OSError):
            return

    def get_package(self, canonical, version='latest'):
        """Looks up a package by canonical version"""
        if ':' not in canonical:
            return
        registry, package = canonical.split(':', 1)
        try:
            path = self._path('packages', registry, package, '%s.json' % version)
            with open(path) as f:
                return PackageInfo(self, json.load(f))
        except (IOError, OSError):
            return

    def get_package_versions(self, canonical):
        """Returns all versions of a package."""
        if ':' not in canonical:
            return
        registry, package = canonical.split(':', 1)
        rv = set()
        for filename in os.listdir(self._path('packages', registry, package)):
            if filename.endswith('.json'):
                with open(self._path('packages', registry, package, filename)) as f:
                    rv.add(json.load(f)['version'])
        return sorted(rv, key=VersionInfo.parse)

    def iter_packages(self):
        for package_registry in os.listdir(self._path('packages')):
            for item in os.listdir(self._path('packages', package_registry)):
                if item.startswith('@'):
                    for subitem in os.listdir(self._path('packages', package_registry, item)):
                        yield '%s:%s/%s' % (package_registry, item, subitem)
                else:
                    yield '%s:%s' % (package_registry, item)

    def get_packages(self):
        rv = {}
        for package_name in self.iter_packages():
            pkg = self.get_package(package_name)
            if pkg is not None:
                rv[pkg.canonical] = pkg
        return rv


@app.route('/sdks/<sdk>/<version>')
def get_sdk(sdk, version):
    resolved_sdk = registry.resolve_marketing_slug(sdk)
    if resolved_sdk is not None:
        return redirect(url_for('get_sdk', sdk=resolved_sdk, version=version))

    sdk_info = registry.get_sdk_info(sdk, version=version)
    if sdk_info is None:
        abort(404)
    return ApiResponse(sdk_info)


@app.route('/packages/<path:package>/<version>')
def get_package_version(package, version):
    pkg_info = registry.get_package(package, version)
    if pkg_info is None:
        abort(404)
    return ApiResponse(pkg_info)


@app.route('/packages/<path:package>/versions')
def get_package_versions(package):
    latest_pkg_info = registry.get_package(package)
    if latest_pkg_info is None:
        abort(404)
    return ApiResponse({
        'latest': latest_pkg_info,
        'versions': registry.get_package_versions(package),
    })


@app.route('/packages')
def get_package_summary():
    return ApiResponse(registry.get_packages())


@app.cli.command('update-repo')
def update_repo():
    """Updates the registry checkout."""
    registry.git.init()
    registry.git.pull()


registry = Registry()
