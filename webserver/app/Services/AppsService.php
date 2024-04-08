<?php

namespace App\Services;

use Illuminate\Support\Str;

class AppsService
{
    public function findDownloadUrl($appInfo, $package, $arch, $platform)
    {
        $package = array_map('strtolower', explode('-', str_replace('_', '-', $package)));
        foreach ($appInfo['file_urls'] as $url) {
            $normalizedUrl = strtolower($url);
            if (Str::endsWith($normalizedUrl, '.exe')) {
                $normalizedUrl = substr($normalizedUrl, 0, -4);
            }
            $parts = explode('-', basename($normalizedUrl));
            if (
                count($parts) > 2 &&
                array_slice($parts, 0, -2) === $package &&
                str_replace('_', '-', $parts[count($parts) - 1]) === str_replace('_', '-', strtolower($arch)) &&
                $parts[count($parts) - 2] === strtolower($platform)
            ) {
                return $url;
            }
        }
        return null;
    }

    public function makeDigest($checksums)
    {
        $rv = [];
        foreach ($checksums ?? [] as $algo => $value) {
            if (Str::endsWith($algo, '-hex')) {
                $rv[] = sprintf(
                    '%s=%s',
                    substr($algo, 0, -4),
                    base64_encode(hex2bin($value))
                );
            } elseif (Str::endsWith($algo, '-base64')) {
                $rv[] = sprintf('%s=%s', substr($algo, 0, -7), $value);
            }
        }
        return implode(',', $rv);
    }

    public function getUrlChecksums($appInfo, $url)
    {
        foreach ($appInfo['files'] ?? [] as $fileInfo) {
            if ($fileInfo['url'] === $url) {
                return $fileInfo['checksums'] ?? null;
            }
        }
        return null;
    }
}