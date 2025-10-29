<?php
namespace App\Controller;

use App\Entity\Plant;
use App\Repository\PlantRepository;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class PlantSuggestionController extends AbstractController
{
    #[Route('/api/suggestions/plants', name: 'api_plants_suggestions', methods: ['GET'])]
    public function suggestions(Request $request, PlantRepository $plantRepository, CacheItemPoolInterface $cache): JsonResponse
    {
        $month = (int) $request->query->get('month', date('n'));
        
        $season = match (true) {
            in_array($month, [12, 1, 2]) => 'Été',
            in_array($month, [3, 4, 5]) => 'Automne', 
            in_array($month, [6, 7, 8]) => 'Hiver',
            in_array($month, [9, 10, 11]) => 'Printemps',
            default => 'Printemps'
        };
        // Cache + déduplication par nom pour la saison
        $cacheKey = 'plant_suggestions_global_' . $season;
        $cacheItem = $cache->getItem($cacheKey);
        if (!$cacheItem->isHit()) {
            $sub = $plantRepository->createQueryBuilder('p2')
                ->select('MAX(p2.id)')
                ->andWhere('p2.bestSeason = :season')
                ->groupBy('p2.name');

            $qb = $plantRepository->createQueryBuilder('p')
                ->andWhere('p.bestSeason = :season')
                ->andWhere($qb = $plantRepository->createQueryBuilder('x')->expr()->in('p.id', $sub->getDQL()))
                ->setParameter('season', $season)
                ->add('orderBy', "CASE p.type WHEN 'Fruit' THEN 1 WHEN 'Légume' THEN 2 WHEN 'Herbe' THEN 3 ELSE 4 END, p.name ASC");

            $plants = $qb->getQuery()->getResult();
            $cacheItem->set($plants);
            $cacheItem->expiresAfter(300);
            $cache->save($cacheItem);
        } else {
            $plants = $cacheItem->get();
        }
        
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
                'imageSlug' => $p->getImageSlug(), // 🚀 Ligne ajoutée
            ], $plants),
        ];
        
        return $this->json($data);
    }
}