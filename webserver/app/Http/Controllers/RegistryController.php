<?php

namespace App\Http\Controllers;

use App\Services\AppsService;
use App\Services\RegistryService;

class RegistryController extends Controller
{
    public function sdks()
    {
        $registryService = new RegistryService();
        $strict = filter_var(request()->input('strict'), FILTER_VALIDATE_BOOLEAN);

        return response()->json($registryService->getSdks($strict));
    }

    public function sdkVersions($sdk_id)
    {
        $registryService = new RegistryService();
        $latestPackage = $registryService->getSdk($sdk_id);
        if ($latestPackage === null) {
            return response()->json(['error' => 'SDK not found'], 404);
        }

        return response()->json([
            'latest' => $latestPackage,
            'versions' => array_values(array_unique($registryService->getPackageVersions($latestPackage->getCanonical()))),
        ]);
    }

    public function sdkVersion($sdk_id, $version)
    {
        $registryService = new RegistryService();
        $package = $registryService->getSdk($sdk_id, $version);
        if ($package === null) {
            return response()->json(['error' => 'SDK not found'], 404);
        }

        return response()->json($package);
    }

    public function packages()
    {
        $registryService = new RegistryService();
        $strict = filter_var(request()->input('strict'), FILTER_VALIDATE_BOOLEAN);
        $package = $registryService->getPackages($strict);
        if ($package === null) {
            return response()->json(['error' => 'Package not found'], 404);
        }

        return response()->json($package);
    }

    public function packagesVersions($canonical)
    {
        $registryService = new RegistryService();
        $latestPackage = $registryService->getPackage($canonical);
        if ($latestPackage === null) {
            return response()->json(['error' => 'Package not found'], 404);
        }

        return response()->json([
            'latest' => $latestPackage,
            'versions' => array_values(array_unique($registryService->getPackageVersions($latestPackage->getCanonical()))),
        ]);
    }

    public function package($canonical, $version = 'latest')
    {
        $registryService = new RegistryService();
        $package = $registryService->getPackage($canonical, $version);
        if ($package === null) {
            return response()->json(['error' => 'Package not found'], 404);
        }

        return response()->json($package);
    }

    public function marketingSlugs()
    {
        $registryService = new RegistryService();

        return response()->json(['slugs' => array_keys($registryService->getMarketingSlugs())]);
    }

    public function marketingSlug($slug)
    {
        $registryService = new RegistryService();
        $slug = $registryService->resolveMarketingSlug($slug);
        if ($slug === null) {
            return response()->json(['error' => 'Slug not found'], 404);
        }

        return response()->json($slug);
    }

    public function awsLambdaLayers()
    {
        $registryService = new RegistryService();

        return response()->json($registryService->getAwsLambdaLayers());
    }

    public function healthcheck()
    {
        return response('ok', 200);
    }

    public function apps()
    {
        $registryService = new RegistryService();

        return response()->json($registryService->getApps());
    }

    public function appVersion($app_id, $version)
    {
        $registryService = new RegistryService();
        $app = $registryService->getApp($app_id, $version);
        if ($app === null) {
            return response()->json(['error' => 'App not found'], 404);
        }

        $appsService = new AppsService();
        $responseType = request()->input('response');
        if ($responseType === 'download') {
            $arch = request()->input('arch');
            $platform = request()->input('platform');
            $package = request()->input('package');
            $url = $appsService->findDownloadUrl($app, $package, $arch, $platform);
            if ($url === null) {
                return response()->json(['error' => 'Download URL not found'], 404);
            }
            $checksums = $appsService->getUrlChecksums($app, $url);
            $response = redirect($url);
            $digest = $appsService->makeDigest($checksums);
            if ($digest) {
                $response->header('Digest', $digest);
            }

            return $response;
        }

        return response()->json($app);
    }
}
