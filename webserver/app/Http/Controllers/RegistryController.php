<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
            'versions' => array_values(array_unique($registryService->getPackageVersions($latestPackage->getCanonical())))
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
            'versions' => array_values(array_unique($registryService->getPackageVersions($latestPackage->getCanonical())))
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
}
