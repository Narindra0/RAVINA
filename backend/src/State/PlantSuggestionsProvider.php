<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\SuggestionsOutput;
use App\Repository\PlantRepository;

final class PlantSuggestionsProvider implements ProviderInterface
{
    // Injectez votre PlantRepository ou tout service nécessaire
    public function __construct(private PlantRepository $plantRepository)
    {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        // 1. Déterminer la saison (logique simple pour l'exemple)
        $currentMonth = (int) date('n');
        
        if ($currentMonth >= 9 && $currentMonth <= 11) {
            $season = 'Automne';
        } elseif ($currentMonth >= 6 && $currentMonth <= 8) {
            $season = 'Été';
        } elseif ($currentMonth >= 3 && $currentMonth <= 5) {
            $season = 'Printemps';
        } else {
            $season = 'Hiver';
        }
        
        // 2. Trouver les plantes idéales (logique à adapter)
        // Par exemple, on pourrait filtrer les plantes où bestSeason correspond à $season.
        // Ici, je retourne un tableau factice pour faire fonctionner le frontend,
        // mais vous devriez implémenter une vraie méthode dans PlantRepository.
        
        // $idealPlants = $this->plantRepository->findBy(['bestSeason' => $season]);
        $idealPlants = []; // Remplacez par votre vraie logique de filtre

        // 3. Formater la réponse dans l'objet DTO
        $output = new SuggestionsOutput();
        $output->currentSeason = $season;
        $output->suggestions = $idealPlants;

        return $output;
    }
}