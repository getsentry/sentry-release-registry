<?php

namespace App\Livewire;

use App\Services\RegistryService;
use Livewire\Component;

class FeatureMatrix extends Component
{
    public $count = 1;

    protected RegistryService $registryService;

    public function __construct()
    {
        $this->registryService = new RegistryService();
    }

    public function mount()
    {

    }

    public function increment()
    {
        $this->count++;
    }

    public function decrement()
    {
        $this->count--;
    }

    public function render()
    {
        $sdks = $this->registryService->getSdks();

        return view('livewire.feature-matrix', compact('sdks'));
    }
}
