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

    public function getName()
    {
        return $this->data['name'];
    }

    public function jsonSerialize(): mixed
    {
        return $this->data;
    }

    public function getRepoUrl(): string
    {
        return $this->data['repo_url'];
    }

    public function getDocsUrl(): string
    {
        return $this->data['main_docs_url'];
    }

    public function getCategories(): array
    {
        return $this->data['categories'];
    }

    public function getFeatures(): array
    {
        return $this->data['features'];
    }

    public function getCreatedAt(): string
    {
        $date = new \DateTime($this->data['createdAt']);
        return $date->format('Y-m-d H:i:s');
    }
}
