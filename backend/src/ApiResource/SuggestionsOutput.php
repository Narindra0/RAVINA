<?php

namespace App\ApiResource;

class SuggestionsOutput
{
    public string $currentSeason;
    
    /**
     * @var array<\App\Entity\Plant>
     */
    public array $suggestions = [];
}