import binascii
import json
import os
import re
from functools import partial
from typing import Any, Optional

from datadog import initialize as datadog_initialize, statsd

import sentry_sdk
from cachelib import SimpleCache
from flask import Flask, abort, jsonify, request, redirect
from flask.json.provider import DefaultJSONProvider
from semver import Version


TRUTHY_VALUES = {"1", "true", "yes"}

# If this file is present in a subfolder in "packages", that subfolder is a namespace.
NAMESPACE_FILE_MARKER = "__NAMESPACE__"


class Metrics:
    PREFIX = os.getenv("METRICS_PREFIX", "release_registry")

    def initialize(self, **kwargs):
        # DATADOG_API_KEY, DATADOG_APP_KEY can be provided from env
        # TODO(michal): Pass statsd_constant_tags from env?
        datadog_initialize(**kwargs)
        return self

    @staticmethod
    def tags_from_request():
        tags = []
        if request.url_rule:
            tags.append(f"route:{request.url_rule.rule}")
        return tags

    def _metric(self, name):
        return f"{self.PREFIX}.{name}"

    def increment(self, name, value=1, tags=None, sample_rate=None):
        statsd.increment(
            self._metric(name),
            value=value,
            tags=self.tags_from_request() + (tags or []),
            sample_rate=sample_rate,
        )


metrics = Metrics().initialize()


def traces_sampler(sampling_context):
    path = sampling_context.get("wsgi_environ", {}).get("PATH_INFO", None)
    if path is None:
        return 0.0
    if path == "/healthz":
        return 0.0

    return 1.0


# SENTRY_DSN will be taken from env
sentry_sdk.init(
    traces_sampler=traces_sampler,
    profiles_sample_rate=1.0,
)

CACHE_TIMEOUT = 3600
cache = SimpleCache(threshold=200, default_timeout=CACHE_TIMEOUT)


class InvalidPathComponent(ValueError):
    pass


class RegistryJSONProvider(DefaultJSONProvider):
    @staticmethod
    def default(o):
        if hasattr(o, "to_json"):
            return o.to_json()
        return DefaultJSONProvider.default(o)


class RegistryFlask(Flask):
    json_provider_class = RegistryJSONProvider

    def make_response(self, result):
        if isinstance(result, ApiResponse):
            response = jsonify(result.data)
        else:
            response = Flask.make_response(self, result)

        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "sentry-trace, baggage"
        return response


def validate_path_component(path):
    if not path:
        raise InvalidPathComponent("Invalid path")
    for item in path.split("/"):
        if item == "." or item == ".." or not item:
            raise InvalidPathComponent("Invalid path %s" % path)


class ApiResponse(object):
    def __init__(self, data):
        self.data = data


class PackageInfo(object):
    def __init__(self, registry, data):
        self._registry = registry
        self._data = data

    @property
    def canonical(self):
        return self._data["canonical"]

    @property
    def sdk_id(self):
        return self._data.get("sdk_id")

    @property
    def version(self):
        return self._data["version"]

    def to_json(self):
        return self._data


def _normalize_aws_lambda_layer(
    data: dict[str, Any],
    runtime: str,
    canonical: Optional[str] = None,
) -> dict[str, Any]:
    normalized = {
        **data,
        "canonical": canonical or data["canonical"],
        "runtime": runtime,
        "regions": [
            {
                **region,
                "layer_version": region["version"],
            }
            for region in data["regions"]
        ],
    }
    normalized["sdk_major"] = str(Version.parse(data["sdk_version"]).major)
    return normalized


class Registry(object):
    def __init__(self):
        self.path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def _path(self, *args):
        for arg in args:
            validate_path_component(arg)
        return os.path.join(self.path, *args)

    def get_package(self, canonical, version="latest"):
        """Looks up a package by its canonical name and version"""
        if ":" not in canonical:
            return
        registry, package = canonical.split(":", 1)
        # Allow ":" to be used as a path separator
        package = package.replace(":", "/")
        try:
            path = self._path("packages", registry, package, "%s.json" % version)
            with open(path) as f:
                return PackageInfo(self, json.load(f))
        except (IOError, OSError):
            sentry_sdk.capture_exception()
            return

    def get_package_versions(self, canonical):
        """Returns all versions of a package."""
        if ":" not in canonical:
            return
        registry, package = canonical.split(":", 1)
        rv = set()
        for filename in os.listdir(self._path("packages", registry, package)):
            if filename.endswith(".json"):
                with open(self._path("packages", registry, package, filename)) as f:
                    rv.add(json.load(f)["version"])
        return sorted(rv, key=Version.parse)

    def iter_packages(self):
        for package_registry in os.listdir(self._path("packages")):
            for item in os.listdir(self._path("packages", package_registry)):
                if os.path.exists(
                    os.path.join(
                        self._path(
                            "packages", package_registry, item, NAMESPACE_FILE_MARKER
                        )
                    )
                ):
                    for subitem in os.listdir(
                        self._path("packages", package_registry, item)
                    ):
                        if subitem != NAMESPACE_FILE_MARKER:
                            yield "%s:%s/%s" % (package_registry, item, subitem)
                else:
                    yield "%s:%s" % (package_registry, item)

    def get_packages(self, strict=False):
        rv = {}
        for package_name in self.iter_packages():
            pkg = self.get_package(package_name)
            if pkg is None:
                if strict:
                    raise ValueError(
                        "Package does not exist or invalid canonical: {}".format(
                            package_name
                        )
                    )
            else:
                rv[pkg.canonical] = pkg
        return rv

    def get_sdks(self, strict=False):
        rv = {}
        for link in os.listdir(self._path("sdks")):
            try:
                with sentry_sdk.start_span(
                    op="open_json", description=f"sdks/{link}/latest.json"
                ):
                    with open(self._path("sdks", link, "latest.json")) as f:
                        canonical = json.load(f)["canonical"]
                        pkg = self.get_package(canonical)
                        if pkg is None:
                            if strict:
                                raise ValueError(
                                    "Package {}, canonical cannot be resolved: {}".format(
                                        link, canonical
                                    )
                                )
                        else:
                            rv[link] = pkg
            except (IOError, OSError):
                sentry_sdk.capture_exception()
                continue
        return rv

    def get_sdk(self, sdk_id, version="latest"):
        try:
            with open(self._path("sdks", sdk_id, "latest.json")) as f:
                canonical = json.load(f)["canonical"]
                return self.get_package(canonical, version)
        except (IOError, OSError):
            sentry_sdk.capture_exception()
            pass

    def _read_aws_lambda_layer(self, runtime: str, filename: str):
        with open(self._path("aws-lambda-layers", runtime, filename)) as f:
            return json.load(f)

    def get_aws_lambda_layer(self, runtime: str, version: str):
        try:
            data = self._read_aws_lambda_layer(runtime, f"{version}.json")
        except OSError:
            sentry_sdk.capture_exception()
            return

        canonical = data["canonical"]
        if version != "latest":
            canonical_version = (
                version if re.fullmatch(r"\d+", version) else data["sdk_version"]
            )
            canonical = f"{canonical}:v{canonical_version}"

        return _normalize_aws_lambda_layer(data, runtime, canonical=canonical)

    def build_aws_lambda_layer_cache(self):
        latest_layers = {}
        summaries = {}
        version_indexes = {}
        layers = {}
        for runtime in os.listdir(self._path("aws-lambda-layers")):
            runtime_path = self._path("aws-lambda-layers", runtime)
            versions = []
            version_metadata = {}
            latest = None
            major_layers = []

            for name in os.listdir(runtime_path):
                if name == "base.json" or not name.endswith(".json"):
                    continue
                version = name.removesuffix(".json")
                layer = self.get_aws_lambda_layer(runtime, version)
                if layer is None:
                    continue

                layers[(runtime, version)] = layer
                if version == "latest":
                    latest = layer
                    latest_layer = layer.copy()
                    latest_layer.pop("runtime")
                    latest_layer.pop("sdk_major")
                    latest_layer["regions"] = [
                        {"region": region["region"], "version": region["version"]}
                        for region in layer["regions"]
                    ]
                    latest_layers[layer["canonical"]] = latest_layer
                elif re.fullmatch(r"\d+", version):
                    major_layers.append(layer)
                elif Version.is_valid(version):
                    versions.append(version)
                    metadata = {"sdk_version": layer["sdk_version"]}
                    for field in (
                        "compatible_runtimes",
                        "compatible_architectures",
                    ):
                        if layer.get(field):
                            metadata[field] = layer[field]
                    version_metadata[version] = metadata

            if latest is None:
                continue

            summaries[latest["canonical"]] = latest
            summaries.update((layer["canonical"], layer) for layer in major_layers)
            versions.sort(key=Version.parse, reverse=True)
            version_indexes[runtime] = {
                "runtime": runtime,
                "latest": latest["sdk_version"],
                "versions": versions,
                "version_metadata": version_metadata,
            }

        return latest_layers, summaries, version_indexes, layers

    def get_apps(self):
        rv = {}
        for link in os.listdir(self._path("apps")):
            try:
                app = self.get_app(link)
                if app is not None:
                    rv[link] = app
            except (IOError, OSError):
                sentry_sdk.capture_exception()
                continue
        return rv

    def get_app(self, app_id, version="latest"):
        try:
            with open(self._path("apps", app_id, "%s.json" % version)) as f:
                return json.load(f)
        except (IOError, OSError):
            sentry_sdk.capture_exception()
            pass

    def get_marketing_slugs(self):
        with open(self._path("misc", "marketing-slugs.json")) as f:
            return json.load(f)

    def resolve_marketing_slug(self, slug):
        slugs = self.get_marketing_slugs()
        data = slugs.get(slug)
        if data is None:
            return
        target = None
        if data["type"] == "sdk":
            target = self.get_sdk(data["target"])
        elif data["type"] == "package":
            target = self.get_package(data["target"])
        elif data["type"] == "integration":
            if data.get("sdk"):
                package = self.get_sdk(data["sdk"])
            elif data.get("package"):
                package = self.get_package(data["package"])
            else:
                package = None
            if package is not None:
                target = {
                    "package": package,
                    "integration": data["integration"],
                }
        return {
            "definition": data,
            "target": target,
        }


def is_caching_enabled():
    cache_env = os.getenv("REGISTRY_ENABLE_CACHE", "").strip()
    if cache_env == "1":
        return True
    elif cache_env == "0":
        return False
    return os.getenv("FLASK_ENV") == "production"


def return_cached():
    if not app.config.get("CACHE_ENABLED"):
        return None
    # Excluding AWS Lambda layer route from caching because it
    # produced race conditions and returned empty responses
    if request.path == "/aws-lambda-layers" or request.method == "OPTIONS":
        return None
    if not request.values:
        response = cache.get(request.path)
        if response:
            metrics.increment("cache_hit")
            response.headers["X-From-Cache"] = "1"
            return response
    metrics.increment("cache_miss")


def cache_response(response):
    if not app.config.get("CACHE_ENABLED"):
        return response
    # Excluding AWS Lambda layer route from caching because it
    # produced race conditions and returned empty responses.
    # Instead, we "simulate" a cache hit (see get_aws_lambda_layers())
    if request.path == "/aws-lambda-layers":
        metrics.increment("cache_hit")
        response.headers["X-From-Cache"] = "1"
        return response
    if request.method == "OPTIONS":
        return response
    if not request.values:
        response.freeze()
        metrics.increment("cache_set")
        cache.set(request.path, response)
    return response


def set_cache_enabled(app, enable: bool):
    assert type(enable) is bool
    app.config["CACHE_ENABLED"] = enable


def find_download_url(app_info, package, arch, platform):
    package = package.replace("_", "-").lower().split("-")
    for url in app_info["file_urls"].values():
        normalized_url = url.lower()
        if normalized_url.endswith(".exe"):
            normalized_url = normalized_url[:-4]
        parts = normalized_url.split("/")[-1].split("-")
        if (
            len(parts) > 2
            and parts[:-2] == package
            and parts[-1].replace("_", "-") == arch.lower().replace("_", "-")
            and parts[-2] == platform.lower()
        ):
            return url


def make_digest(checksums):
    rv = []
    for algo, value in (checksums or {}).items():
        if algo.endswith("-hex"):
            rv.append(
                "%s=%s"
                % (
                    algo[:-4],
                    binascii.b2a_base64(binascii.a2b_hex(value), newline=False).decode(
                        "utf-8"
                    ),
                )
            )
        elif algo.endswith("-base64"):
            rv.append("%s=%s" % (algo[:-7], value))
    return ",".join(rv)


def get_url_checksums(app_info, url):
    for file_info in (app_info.get("files") or {}).values():
        if file_info["url"] == url:
            return file_info.get("checksums")


app = RegistryFlask(__name__)
app.config.from_envvar("APISERVER_CONFIG", silent=True)

# Must come before the caching callbacks otherwise it will never be called for
# requests served by the caching callback.
app.before_request(partial(metrics.increment, "request"))
app.before_request(return_cached)
app.after_request(cache_response)

app.enable_cache = partial(set_cache_enabled, app)
app.enable_cache(is_caching_enabled())


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_response("")
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "sentry-trace, baggage"
        return response


@app.route("/packages/<path:package>/<version>")
def get_package_version(package, version):
    pkg_info = registry.get_package(package, version)
    if pkg_info is None:
        abort(404)
    return ApiResponse(pkg_info)


@app.route("/packages/<path:package>/versions")
def get_package_versions(package):
    latest_pkg_info = registry.get_package(package)
    if latest_pkg_info is None:
        abort(404)
    return ApiResponse(
        {
            "latest": latest_pkg_info,
            "versions": registry.get_package_versions(package),
        }
    )


@app.route("/marketing-slugs")
def get_marketing_slugs():
    return ApiResponse(dict(slugs=sorted(registry.get_marketing_slugs().keys())))


@app.route("/marketing-slugs/<slug>")
def resolve_marketing_slugs(slug):
    rv = registry.resolve_marketing_slug(slug)
    if rv is None:
        abort(404)
    return ApiResponse(rv)


@app.route("/sdks")
def get_sdk_summary():
    strict = request.args.get("strict", "").lower() in TRUTHY_VALUES
    return ApiResponse(registry.get_sdks(strict=strict))


@app.route("/sdks/<sdk_id>/<version>")
def get_sdk_version(sdk_id, version):
    pkg_info = registry.get_sdk(sdk_id, version)
    if pkg_info is None:
        abort(404)
    return ApiResponse(pkg_info)


@app.route("/sdks/<sdk_id>/versions")
def get_sdk_versions(sdk_id):
    latest_pkg_info = registry.get_sdk(sdk_id)
    if latest_pkg_info is None:
        abort(404)
    return ApiResponse(
        {
            "latest": latest_pkg_info,
            "versions": registry.get_package_versions(latest_pkg_info.canonical),
        }
    )


@app.route("/packages")
def get_package_summary():
    strict = request.args.get("strict", "").lower() in TRUTHY_VALUES
    return ApiResponse(registry.get_packages(strict=strict))


@app.route("/apps")
def get_app_summary():
    return ApiResponse(registry.get_apps())


@app.route("/apps/<app_id>/<version>")
def get_app_version(app_id, version):
    app_info = registry.get_app(app_id, version)
    if app_info is None:
        abort(404)
    if request.args.get("response") == "download":
        arch = request.args["arch"]
        platform = request.args["platform"]
        package = request.args["package"]
        url = find_download_url(app_info, package, arch, platform)
        if url is None:
            abort(404)
        checksums = get_url_checksums(app_info, url)
        rv = redirect(url)
        digest = make_digest(checksums)
        if digest:
            rv.headers["Digest"] = digest
        return rv
    return ApiResponse(app_info)


@app.route("/healthz")
def healthcheck():
    return "ok\n", 200


@app.route("/aws-lambda-layers")
def aws_layers() -> ApiResponse:
    return ApiResponse(_aws_lambda_layers)


@app.route("/aws-lambda-layers/index")
def aws_layers_index() -> ApiResponse:
    return ApiResponse(_aws_lambda_layer_index)


@app.route("/aws-lambda-layers/<runtime>/versions")
def aws_layer_versions(runtime: str) -> ApiResponse:
    versions = _aws_lambda_layer_version_indexes.get(runtime)
    if versions is None:
        abort(404)
    return ApiResponse(versions)


@app.route("/aws-lambda-layers/<runtime>/<version>")
def aws_layer_version(runtime: str, version: str) -> ApiResponse:
    layer = _aws_lambda_layers_by_version.get((runtime, version))
    if layer is None:
        abort(404)
    return ApiResponse(layer)


registry = Registry()

# "manually" caching AWS response upfront to avoid
# empty responses caused by cache race conditions
(
    _aws_lambda_layers,
    _aws_lambda_layer_index,
    _aws_lambda_layer_version_indexes,
    _aws_lambda_layers_by_version,
) = registry.build_aws_lambda_layer_cache()
