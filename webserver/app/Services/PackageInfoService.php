<?php

namespace App\Services;

class PackageInfoService implements \JsonSerializable
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function getCanonical()
    {
        return $this->data['canonical'];
    }

    public function getSdkId()
    {
        return $this->data['sdk_id'] ?? null;
    }

    public function getVersion()
    {
        return $this->data['version'];
    }

    public function jsonSerialize(): mixed
    {
        return $this->data;
    }
}
