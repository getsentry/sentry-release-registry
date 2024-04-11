<div>
    @php /** @var \App\Services\PackageInfoService $sdk */ @endphp
    <div class="container mx-auto p-4">
        <div class="flex flex-wrap">
            @foreach ($sdks as $sdkIdentifer => $sdk)
                <div class="relative w-full rounded-lg bg-white px-4 pb-12 pt-5 shadow mb-4">
                    <dt>
                        @include('components/platformicon', ['icon' => $sdkIdentifer])

                        <p class="ml-16 truncate text-sm font-medium text-gray-500">{{ $sdk->getVersion() }} | {{ $sdkIdentifer }}</p>
                    </dt>
                    <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
                        <p class="text-2xl font-semibold text-gray-900">{{ $sdk->getName() }}</p>
                        <p class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <svg class="h-5 w-5 flex-shrink-0 self-center text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd" />
                            </svg>
                            <span class="sr-only"> Increased by </span>
                            122
                        </p>
                        <div class="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4">
                            <div class="flex flex-wrap gap-4">
                                <div class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                    <a href="{{ $sdk->getDocsUrl() }}">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                             stroke="currentColor" class="inline w-6 h-6">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                  d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"/>
                                        </svg>
                                        Docs
                                    </a>
                                </div>
                                <div class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                    <a href="{{ $sdk->getRepoUrl() }}">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                             stroke="currentColor" class="inline w-6 h-6">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                  d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"/>
                                        </svg>
                                        Repo
                                    </a>
                                </div>
                            </div>
                        </div>
                    </dd>
                </div>
            @endforeach
        </div>
    </div>
</div>
