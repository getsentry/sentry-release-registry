<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/sdks', 'App\Http\Controllers\RegistryController@sdks');
Route::get('/sdks/{sdk_id}/versions', 'App\Http\Controllers\RegistryController@sdkVersions');
Route::get('/sdks/{sdk_id}/{version}', 'App\Http\Controllers\RegistryController@sdkVersion');

Route::get('/packages', 'App\Http\Controllers\RegistryController@packages');
Route::get('/packages/{canonical}/versions', 'App\Http\Controllers\RegistryController@packagesVersions');
Route::get('/packages/{canonical}/{version}', 'App\Http\Controllers\RegistryController@package');