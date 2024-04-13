<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class RegistryService
{
    const NAMESPACE_FILE_MARKER = '__NAMESPACE__';

    protected $path;

    /**
     * RegistryService constructor.
     */
    public function __construct()
    {
        $this->path = dirname(base_path());
    }

    /**
     * Validate the canonical format and unpack into registry and package.
     *
     * @param string $canonical The canonical name of the package.
     * @return array An array with elements: registry and package.
     * @throws \ValueError
     */
    protected function validateCanonical($canonical): array
    {
        if (!Str::contains($canonical, ':')) {
            throw new \ValueError("Invalid canonical: {$canonical}");
        }

        [$registry, $package] = explode(':', $canonical, 2);
        $package = str_replace(':', '/', $package);
        return [$registry, $package];
    }

    /**
     * Fetches a package by its canonical name and version.
     *
     * @param string $canonical The canonical name of the package.
     * @param string $version The version of the package.
     * @return PackageInfoService|null
     */
    public function getPackage($canonical, $version = 'latest'): ?PackageInfoService
    {
        [$registry, $package] = $this->validateCanonical($canonical);

        $path = $this->buildPackagePath($registry, $package, $version);
        if (!File::exists($path)) {
            return null;
        }

        $content = File::get($path);
        return new PackageInfoService(json_decode($content, true));
    }

    /**
     * Builds the filesystem path for a package.
     *
     * @param string $registry The name of the registry.
     * @param string $package The name of the package.
     * @param string $version The version of the package.
     * @return string
     */
    protected function buildPackagePath($registry, $package, $version): string
    {
        return $this->fileSystemPath('packages', $registry, $package, "{$version}.json");
    }

    /**
     * Build a filesystem path based on given segments.
     *
     * @param mixed ...$segments Path segments.
     * @return string
     */
    protected function fileSystemPath(...$segments): string
    {
        return implode(DIRECTORY_SEPARATOR, array_merge([$this->path], $segments));
    }


    /**
     * Retrieves all versions of a package.
     *
     * @param string $canonical The canonical name of the package.
     * @return array An array of all versions of the package.
     */
    public function getPackageVersions($canonical): array
    {
        [$registry, $package] = $this->validateCanonical($canonical);
        $versions = new Collection();

        $files = File::files($this->fileSystemPath('packages', $registry, $package));
        foreach ($files as $file) {
            if ($file->getExtension() === 'json') {
                $versions->push($this->getJsonContent($file->getPathname())['version']);
            }
        }

        return $versions->sort('version_compare')->values()->all();
    }

    /**
     * Iterates over all packages in the registry.
     *
     * This method iterates over all directories in the 'packages' directory. For each directory, it checks if it is a namespace marker.
     * If it is, it yields all packages in the namespace. If it's not, it yields the package directly.
     *
     * @return \Generator A generator yielding package names in the format 'registry:package'.
     */
    public function iteratePackages(): \Generator
    {
        foreach (File::directories($this->fileSystemPath('packages')) as $packageRegistry) {
            foreach (File::directories($packageRegistry) as $item) {
                if ($this->isNamespaceMarker($item)) {
                    yield from $this->iterateNamespacePackages($item, $packageRegistry);
                } else {
                    yield basename($packageRegistry) . ':' . basename($item);
                }
            }
        }
    }

    /**
     * Retrieves all packages in the registry.
     *
     * This method iterates over all packages in the registry. For each package, it tries to get the package details.
     * If the package details are successfully retrieved, it adds the package to the packages array.
     *
     * @param bool $strict If set to true, an exception will be thrown if a package cannot be retrieved. If set to false, the method will continue to the next package.
     * @return array An associative array of packages, with the canonical name as the key and the package details as the value.
     */
    public function getPackages($strict = false): array
    {
        $packages = [];
        foreach ($this->iteratePackages() as $packageName) {
            $package = $this->tryGetPackage($packageName, $strict);
            if ($package !== null) {
                $packages[$package->getCanonical()] = $package;
            }
        }

        return $packages;
    }

    /**
     * Retrieves all SDKs in the registry.
     *
     * This method iterates over all directories in the 'sdks' directory. For each directory, it tries to get the package details.
     * If the package details are successfully retrieved, it adds the package to the sdks array.
     *
     * @param bool $strict If set to true, an exception will be thrown if a package cannot be retrieved. If set to false, the method will continue to the next package.
     * @return array An associative array of SDKs, with the SDK id as the key and the package details as the value.
     */
    public function getSdks($strict = false): array
    {
        $sdks = [];
        $links = File::directories($this->fileSystemPath('sdks'));
        foreach ($links as $link) {
            try {
                $content = File::get(implode(DIRECTORY_SEPARATOR, [realpath($link), 'latest.json']));
                $canonical = json_decode($content, true)['canonical'];
                $pkg = $this->getPackage($canonical);

                if ($pkg === null) {
                    if ($strict) {
                        throw new \ValueError('Package ' . basename($link) . ", canonical cannot be resolved: {$canonical}");
                    }
                } else {
                    $sdks[basename($link)] = $pkg;
                }
            } catch (\Exception $e) {
                // TODO log to Sentry
                continue;
            }
        }

        return $sdks;
    }

    /**
     * Retrieves a specific SDK in the registry by its ID.
     *
     * This method tries to get the package details of the SDK. If the package details are successfully retrieved, it returns the package.
     * If the package details cannot be retrieved, it returns null.
     *
     * @param string $sdkId The ID of the SDK.
     * @param string $version The version of the SDK. Defaults to 'latest'.
     * @return PackageInfoService|null The package details of the SDK, or null if the package details cannot be retrieved.
     */
    public function getSdk($sdkId, $version = 'latest'): ?PackageInfoService
    {
        try {
            $content = File::get($this->fileSystemPath('sdks', $sdkId, 'latest.json'));
            $canonical = json_decode($content, true)['canonical'];

            return $this->getPackage($canonical, $version);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getAwsLambdaLayers(): array
    {
        $layers = [];
        $links = File::directories($this->fileSystemPath('aws-lambda-layers'));
        foreach ($links as $link) {
            try {
                $content = File::get(implode(DIRECTORY_SEPARATOR, [realpath($link), 'latest.json']));
                $data = json_decode($content, true);
                $layers[$data['canonical']] = $data;
            } catch (\Exception $e) {
                continue;
            }
        }

        return $layers;
    }

    public function getApps(): array
    {
        $apps = [];
        $links = File::directories($this->fileSystemPath('apps'));
        foreach ($links as $link) {
            try {
                $app = $this->getApp(basename($link));
                if ($app !== null) {
                    $apps[basename($link)] = $app;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return $apps;
    }

    public function getApp($appId, $version = 'latest')
    {
        try {
            $content = File::get($this->fileSystemPath('apps', $appId, "{$version}.json"));

            return json_decode($content, true);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getMarketingSlugs()
    {
        $content = File::get($this->fileSystemPath('misc', 'marketing-slugs.json'));

        return json_decode($content, true);
    }

    public function resolveMarketingSlug($slug): ?array
    {
        $slugs = $this->getMarketingSlugs();
        $data = $slugs[$slug] ?? null;
        if ($data === null) {
            return null;
        }

        $target = null;
        if ($data['type'] === 'sdk') {
            $target = $this->getSdk($data['target']);
        } elseif ($data['type'] === 'package') {
            $target = $this->getPackage($data['target']);
        } elseif ($data['type'] === 'integration') {
            $package = null;
            if (isset($data['sdk'])) {
                $package = $this->getSdk($data['sdk']);
            } elseif (isset($data['package'])) {
                $package = $this->getPackage($data['package']);
            }

            if ($package !== null) {
                $target = [
                    'package' => $package,
                    'integration' => $data['integration'],
                ];
            }
        }

        return [
            'definition' => $data,
            'target' => $target,
        ];
    }

    private function getJsonContent($path)
    {
        if (!File::exists($path)) {
            return [];
        }
        return json_decode(File::get($path), true);
    }

    private function isNamespaceMarker($item): bool
    {
        $namespaceFilePath = implode(DIRECTORY_SEPARATOR, [$item, self::NAMESPACE_FILE_MARKER]);
        return File::exists($namespaceFilePath);
    }

    private function iterateNamespacePackages($item, $packageRegistry): \Generator
    {
        foreach (File::directories($item) as $subitem) {
            if (basename($subitem) !== self::NAMESPACE_FILE_MARKER) {
                yield basename($packageRegistry) . ':' . basename($item) . '/' . basename($subitem);
            }
        }
    }

    private function tryGetPackage($packageName, $strict): ?PackageInfoService
    {
        try {
            $pkg = $this->getPackage($packageName);
        } catch (\Exception $e) {
            if ($strict) {
                throw $e;
            }
            return null;
        }
        return $pkg;
    }
}
