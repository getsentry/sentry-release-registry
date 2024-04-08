<?php

namespace Tests\Unit;

use Tests\TestCase;

class RegistryControllerTest extends TestCase
{
    public static function sdksUrlProvider()
    {
        return [
            'non_strict' => ['/sdks'],
            'strict' => ['/sdks?strict=1'],
        ];
    }

    /**
     * @dataProvider sdksUrlProvider
     */
    public function testRouteSdks($sdksUrl)
    {
        $response = $this->get($sdksUrl);
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals('pypi:sentry-sdk', $data['sentry.python']['canonical']);
        $this->assertEquals('maven:io.sentry:sentry', $data['sentry.java']['canonical']);
    }

    public function testRoutesSdkSingleLatest()
    {
        $response = $this->get('/sdks/sentry.python/latest');
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals('pypi:sentry-sdk', $data['canonical']);
    }

    public static function packagesUrlProvider()
    {
        return [
            'non_strict' => ['/packages'],
            'strict' => ['/packages?strict=1'],
        ];
    }

    /**
     * @dataProvider packagesUrlProvider
     */
    public function testRoutePackages($packagesUrl)
    {
        $response = $this->get($packagesUrl);
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals('pypi:sentry-sdk', $data['pypi:sentry-sdk']['canonical']);
        $this->assertEquals('maven:io.sentry:sentry', $data['maven:io.sentry:sentry']['canonical']);
    }

    public function testRouteApps()
    {
        $response = $this->get('/apps');
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertArrayHasKey('sentry-cli', $data);
    }

    public function testDownloadApp()
    {
        $response = $this->get('/apps/sentry-cli/2.0.0?response=download&platform=windows&arch=x86-64&package=sentry-cli');
        $response->assertStatus(302);
        $response->assertHeader('digest', 'sha256=XH6zBy7cSQHQIJUVWw0bMMADxTsl5KoN0hsx5RDBveI=');
        $response->assertHeader('location', 'https://downloads.sentry-cdn.com/sentry-cli/2.0.0/sentry-cli-Windows-x86_64.exe');
    }

    public function testRouteMarketingSlugs()
    {
        $response = $this->get('/marketing-slugs');
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertContains('browser', $data['slugs']);
    }

    public function testHealthcheck()
    {
        $response = $this->get('/healthz');
        $response->assertStatus(200);
        $response->assertSeeText('ok');
    }
}