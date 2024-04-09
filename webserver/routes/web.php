<?php

use Illuminate\Support\Facades\Route;
use App\Livewire\FeatureMatrix;

Route::get('/', FeatureMatrix::class);

Route::get('/sdks', 'App\Http\Controllers\RegistryController@sdks');
Route::get('/sdks/{sdk_id}/versions', 'App\Http\Controllers\RegistryController@sdkVersions');
Route::get('/sdks/{sdk_id}/{version}', 'App\Http\Controllers\RegistryController@sdkVersion');

Route::get('/packages', 'App\Http\Controllers\RegistryController@packages');
Route::get('/packages/{canonical}/versions', 'App\Http\Controllers\RegistryController@packagesVersions');
Route::get('/packages/{canonical}/{version}', 'App\Http\Controllers\RegistryController@package');

Route::get('/marketing-slugs', 'App\Http\Controllers\RegistryController@marketingSlugs');
Route::get('/marketing-slugs/{slug}', 'App\Http\Controllers\RegistryController@marketingSlug');

Route::get('/healthz', 'App\Http\Controllers\RegistryController@healthcheck');

Route::get('/aws-lambda-layer', 'App\Http\Controllers\RegistryController@awsLambdaLayers');

Route::get('/apps', 'App\Http\Controllers\RegistryController@apps');
Route::get('/apps/{app_id}/{version}', 'App\Http\Controllers\RegistryController@appVersion');
