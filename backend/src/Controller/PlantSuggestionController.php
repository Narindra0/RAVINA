<?php

namespace App\Controller;

use App\Entity\Plant;
use App\Repository\PlantRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class PlantSuggestionController extends AbstractController
{
    // NOTE: on évite le conflit avec /api/plants/{id} d'API Platform
    #[Route('/api/suggestions/plants', name: 'api_plants_suggestions', methods: ['GET'])]
    public function suggestions(Request $request, PlantRepository $plantRepository): JsonResponse
    {
        $month = (int) $request->query->get('month', date('n')); // ex: 10 pour octobre

        // Déterminer la saison selon la logique spécifiée
        $season = match (true) {
            in_array($month, [12, 1, 2]) => 'Été',
            in_array($month, [3, 4, 5]) => 'Automne', 
            in_array($month, [6, 7, 8]) => 'Hiver',
            in_array($month, [9, 10, 11]) => 'Printemps',
            default => 'Printemps' // Par défaut
        };

        // Récupérer les plantes de la saison correspondante
        $plants = $plantRepository->findBy(['bestSeason' => $season]);

        // Trier les plantes par type (fruit, légume, herbe)
        usort($plants, function($a, $b) {
            $typeOrder = ['Fruit' => 1, 'Légume' => 2, 'Herbe' => 3];
            $aOrder = $typeOrder[$a->getType()] ?? 4;
            $bOrder = $typeOrder[$b->getType()] ?? 4;
            return $aOrder <=> $bOrder;
        });

        // Générer la réponse avec les noms de mois en français
        $monthNames = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];

        $data = [
            'currentMonth' => $monthNames[$month] ?? 'Inconnu',
            'currentSeason' => $season,
            'suggestions' => array_map(fn(Plant $p) => [
                'id' => $p->getId(),
                'name' => $p->getName(),
                'type' => $p->getType(),
                'bestSeason' => $p->getBestSeason(),
                'wateringFrequency' => $p->getWateringFrequency(),
                'sunExposure' => $p->getSunExposure(),
            ], $plants),
        ];

        return $this->json($data);
    }
}
