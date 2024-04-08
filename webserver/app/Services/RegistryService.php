<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

use App\Services\PackageInfoService;

class RegistryService
{
    const NAMESPACE_FILE_MARKER = '__NAMESPACE__';

    protected $path;

    public function __construct()
    {
        $this->path = dirname(base_path());
    }

    protected function _path(...$args)
    {
        return implode(DIRECTORY_SEPARATOR, array_merge([$this->path], $args));
    }

    protected function validateCanonical($canonical)
    {
        if (!str_contains($canonical, ':')) {
            return throw new \ValueError("Invalid canonical: {$canonical}");
        }

        [$registry, $package] = explode(':', $canonical, 2);
        $package = str_replace(':', '/', $package);

        return [$registry, $package];
    }

    public function getPackage($canonical, $version = 'latest')
    {
        [$registry, $package] = $this->validateCanonical($canonical);
        $package = str_replace(':', '/', $package);

        $path = $this->_path('packages', $registry, $package, "{$version}.json");
        $content = File::get($path);
        return new PackageInfoService(json_decode($content, true));    
    }

    public function getPackageVersions($canonical)
    {
        [$registry, $package] = $this->validateCanonical($canonical);
        $versions = collect();

        $files = File::files($this->_path('packages', $registry, $package));
        foreach ($files as $file) {
            if (str_ends_with($file->getFilename(), '.json')) {
                $content = File::get($file->getPathname());
                $versions->add(json_decode($content, true)['version']);
            }
        }

        return $versions->sort(function ($a, $b) {
            return version_compare($a, $b);
        })->values()->all();
    }

    public function iteratePackages()
    {
        $packageRegistries = File::directories($this->_path('packages'));
        foreach ($packageRegistries as $packageRegistry) {
            $items = File::directories($packageRegistry);
            foreach ($items as $item) {
                $namespaceFilePath = implode(DIRECTORY_SEPARATOR, [realpath($item), self::NAMESPACE_FILE_MARKER]);
                if (File::exists($namespaceFilePath)) {
                    $subitems = File::directories(realpath($item));
                    foreach ($subitems as $subitem) {
                        if (basename($subitem) !== self::NAMESPACE_FILE_MARKER) {
                            yield basename($packageRegistry) . ':' . basename($item) . '/' . basename($subitem);
                        }
                    }
                } else {
                    yield basename($packageRegistry) . ':' . basename($item);
                }
            }
        }
    }

    public function getPackages($strict = false)
    {
        $packages = [];
        foreach ($this->iteratePackages() as $packageName) {
            $pkg = $this->getPackage($packageName);
            if ($pkg === null) {
                if ($strict) {
                    throw new \ValueError("Package does not exist or invalid canonical: {$packageName}");
                }
            } else {
                $packages[$pkg->getCanonical()] = $pkg;
            }
        }
        return $packages;
    }

    public function getSdks($strict = false)
    {
        $sdks = [];
        $links = File::directories($this->_path('sdks'));
        foreach ($links as $link) {
            try {
                $content = File::get(implode(DIRECTORY_SEPARATOR, [realpath($link), 'latest.json']));
                $canonical = json_decode($content, true)['canonical'];
                $pkg = $this->getPackage($canonical);
                
                if ($pkg === null) {
                    if ($strict) {
                        throw new \ValueError("Package " . basename($link) . ", canonical cannot be resolved: {$canonical}");
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

    public function getSdk($sdkId, $version = 'latest')
    {
        try {
            $content = File::get($this->_path('sdks', $sdkId, 'latest.json'));
            $canonical = json_decode($content, true)['canonical'];
            return $this->getPackage($canonical, $version);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getAwsLambdaLayers()
    {
        $layers = [];
        $links = File::directories($this->_path('aws-lambda-layers'));
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

    public function getApps()
    {
        $apps = [];
        $links = File::directories($this->_path('apps'));
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
            $content = File::get($this->_path('apps', $appId, "{$version}.json"));
            return json_decode($content, true);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getMarketingSlugs()
    {
        $content = File::get($this->_path('misc', 'marketing-slugs.json'));
        return json_decode($content, true);
    }

    public function resolveMarketingSlug($slug)
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
}