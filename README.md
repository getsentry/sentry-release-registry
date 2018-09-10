# sentry-release-registry

This is a meta repository holding all release information.  This replaces the mess
we had before where release infos where in different locations.  This is used by
the new SDK docs as well as sentry's loader itself.

## Layout

* `api-server`: A small web service that services up the contents of this repo
* `bin`: some utility scripts to maintain the files here
* `packages`: a registry of all packages we publish that we want to collect releases of
* `sdks`: canonical representations of packages that together form an sdk
* `marketing-slugs`: short names for sdks the docs would use

Some of the information here is maintained as symlinks so this repo only works on
unix platforms.  Use the `bin/sync-links` script to help you update the links.
