<?php

namespace App\Http\Controllers;

use App\Services\AppsService;
use App\Services\RegistryService;
use Illuminate\Http\JsonResponse;

class RegistryController extends Controller
{
    public function __construct(
        protected RegistryService $registryService,
    ) {
    }

    public function sdks(): JsonResponse
    {
        $strict = filter_var(request()->input('strict'), FILTER_VALIDATE_BOOLEAN);

        return response()->json($this->registryService->getSdks($strict));
    }

    public function sdkVersions($sdkId): JsonResponse
    {
        $latestPackage = $this->registryService->getSdk($sdkId);
        if ($latestPackage === null) {
            return response()->json(['error' => 'SDK not found'], 404);
        }

        return response()->json([
            'latest' => $latestPackage,
            'versions' => array_values(array_unique($this->registryService->getPackageVersions($latestPackage->getCanonical()))),
        ]);
    }

    public function sdkVersion($sdkId, $version)
    {
        $package = $this->registryService->getSdk($sdkId, $version);
        if ($package === null) {
            return response()->json(['error' => 'SDK not found'], 404);
        }

        return response()->json($package);
    }

    public function packages()
    {
        $strict = filter_var(request()->input('strict'), FILTER_VALIDATE_BOOLEAN);
        $package = $this->registryService->getPackages($strict);
        if ($package === null) {
            return response()->json(['error' => 'Package not found'], 404);
        }

        return response()->json($package);
    }

    public function packagesVersions($canonical)
    {
        $latestPackage = $this->registryService->getPackage($canonical);
        if ($latestPackage === null) {
            return response()->json(['error' => 'Package not found'], 404);
        }

        return response()->json([
            'latest' => $latestPackage,
            'versions' => array_values(array_unique($this->registryService->getPackageVersions($latestPackage->getCanonical()))),
        ]);
    }

    public function package($canonical, $version = 'latest')
    {
        $package = $this->registryService->getPackage($canonical, $version);
        if ($package === null) {
            return response()->json(['error' => 'Package not found'], 404);
        }

        return response()->json($package);
    }

    public function marketingSlugs()
    {
        return response()->json(['slugs' => array_keys($this->registryService->getMarketingSlugs())]);
    }

    public function marketingSlug($slug)
    {
        $slug = $this->registryService->resolveMarketingSlug($slug);
        if ($slug === null) {
            return response()->json(['error' => 'Slug not found'], 404);
        }

        return response()->json($slug);
    }

    public function awsLambdaLayers()
    {
        return response()->json($this->registryService->getAwsLambdaLayers());
    }

    public function apps()
    {
        return response()->json($this->registryService->getApps());
    }

    public function appVersion($appId, $version)
    {
        $app = $this->registryService->getApp($appId, $version);
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
