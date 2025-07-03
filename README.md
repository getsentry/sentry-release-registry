# Sentry Release Registry

![Build Status](https://github.com/getsentry/release-registry/workflows/Build%20Static%20Site%20Generator/badge.svg)

This is a meta repository holding release information for Sentry repositories.

It centralizes information that used to be in different locations. It is known
to be used by at least:

- The [SDK docs][sdk-docs]
- The [Sentry Loader for JavaScript][js-loader]
- The [SDK update prompt][sdk-update-prompt] in Sentry event pages

[sdk-docs]: https://github.com/getsentry/sentry-docs/
[js-loader]: https://docs.sentry.io/platforms/javascript/#lazy-loading-sentry
[sdk-update-prompt]: https://github.com/getsentry/sentry/blob/ea791cb482d6f77481beed41e64ccc52ce10bc65/src/sentry/sdk_updates.py

## Static Site Generator

The `api-server` directory contains a high-performance Go-based static site generator that replaces the original Flask server. Key benefits:

- ⚡ **46ms build time** (vs 2-3 minutes for Flask)
- 🚀 **<1ms response times** (pre-generated static files)
- 📦 **5.6MB single binary** (no dependencies)
- 🔧 **100% API compatibility** with original Flask server

### Quick Start
```bash
cd api-server
make -f Makefile.new install
make -f Makefile.new serve
```

See [`api-server/README_SSG.md`](api-server/README_SSG.md) for detailed documentation.

## CI/CD

Automated workflows build and test the static site generator:
- ✅ **Build verification** on every commit/PR
- ✅ **Cross-platform builds** (Linux, macOS, Windows)
- ✅ **Docker integration** testing
- ✅ **API endpoint validation**

## Layout

- `api-server`: A small web service that services up the contents of this repo
- `apps`: A registry of all binary apps and utilities we distribute
- `bin`: Some utility scripts to maintain the files here
- `packages`: A registry of all packages we publish that we want to collect
  releases of
- `sdks`: Canonical representations of packages that together form an sdk
- `marketing-slugs`: Short names for sdks the docs would use

Some of the information here is maintained as symlinks, so this repo only works
on unix platforms.

## Adding New SDKs

1. Create `packages/<registry>/<package_name>/<exact_version>.json` for each
   version you want to register.

   - `<registry>`: The package index used. Just create a new directory if you
     are missing one. Stick to alphanumeric characters and you should be fine.
   - `<package_name>`: Can be multiple folders, e.g. `@sentry/node`.
   - `<exact_version>`: `0.3.0`, not `0.3` or `0`. Preview versions such as
     `0.3.0-preview2` or `0.3.0-rc2` also work.

2. Add the following contents:

   ```json
   {
     "name": "Name of your platform",
     "canonical": "<registry>:<package_name>",
     "version": "<exact_version>",
     "package_url": "Link to PyPI, RubyGems, npmjs.com",
     "repo_url": "Link to GitHub repo",
     "main_docs_url": "Link to platform page"
   }
   ```

    If your SDK provides API docs, add the `api_docs_url` config as well:

   ```json
   {
     "name": "Name of your platform",
     "canonical": "<registry>:<package_name>",
     "version": "<exact_version>",
     "package_url": "Link to PyPI, RubyGems, npmjs.com",
     "repo_url": "Link to GitHub repo",
     "main_docs_url": "Link to platform page",
     "api_docs_url": "Link to API docs"
   }
   ```

3. `cd sdks && ln -s ../packages/<registry>/<package_name> <sdk_name>`

   - `<sdk_name>`: The same identifier used in the `sdk_info.name` field of the
     event.

     E.g. the Python SDK sends events like this:

     ```json
     {
       "message": "Hello world!",
       ...,
       "sdk_info": {"name": "sentry.python", ...}
     }
     ```

4. Run `make sync-all-links` to fix up symlinks.

## Adding New Apps

1. Create `apps/<app_name>/<exact_version>.json` for each version you want to
   register.

   - `<package_name>`: Can be multiple folders, e.g. `@sentry/node`.
   - `<exact_version>`: `0.3.0`, not `0.3` or `0`. Preview versions such as
     `0.3.0-preview2` or `0.3.0-rc2` also work.

2. Add the following contents:

   ```json
   {
     "name": "Human readable application name",
     "canonical": "app:<app_name>",
     "version": "<exact_version>",
     "repo_url": "Link to GitHub repo",
     "main_docs_url": "Link to docs page",
     "file_urls": {
       "<filename_with_ext>": "https://downloads.sentry-cdn.com/<app_name>/<exact_version>/<filename_with_ext>"
     }
   }
   ```

3. Run `make sync-all-links` to fix up symlinks.

## Releasing

Basically add a new JSON file like above, and run `make sync-all-links` again.
You might want to use [Craft](https://github.com/getsentry/craft) which can do
this for you as part of your release process.
