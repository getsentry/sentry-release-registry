@props(['sdkIdentifer'])
@php
    $imageMapping = [
        'sentry.php.laravel' => 'laravel.svg',
        'sentry.php*' => 'php.svg',
        'sentry.java*' => 'java.svg',
        'sentry.javascript.node' => 'node.svg',
        'sentry.javascript.bun' => 'bun.svg',
        'sentry.javascript.react' => 'react.svg',
        'sentry.javascript.angular' => 'angularjs.svg',
        'sentry.javascript.vue' => 'vue.svg',
        'sentry.javascript*' => 'javascript.svg',
        'sentry.python*' => 'python.svg',
        'sentry.ruby*' => 'ruby.svg',
        'sentry.java' => 'java.svg',
        'sentry.go' => 'go.svg',
        'sentry.swift' => 'swift.svg',
        'sentry.dart*' => 'dart.svg',
        'sentry.flutter' => 'flutter.svg',
        'sentry.dotnet*' => 'dotnet.svg',
        'sentry.kotlin*' => 'kotlin.svg',
        'sentry.cocoa' => 'apple.svg',
        'sentry.csharp' => 'csharp.svg',
        'sentry.android' => 'android.svg',
        'sentry.ios' => 'ios.svg',
        'sentry.kotlin' => 'kotlin.svg',
        'sentry.rust*' => 'rust.svg',
    ];

    $imageName = 'default.svg';

    foreach ($imageMapping as $key => $value) {
        if (fnmatch($key, $sdkIdentifer)) {
            $imageName = $value;
            break;
        }
    }
@endphp

<div class="absolute">
    <img src="{{ asset('/images/platformicons/' . $imageName) }}" width="54" height="54" class="rounded-md" />
</div>
