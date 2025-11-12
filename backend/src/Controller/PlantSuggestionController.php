<?php
namespace App\Controller;

use App\Entity\PlantTemplate;
use App\Repository\PlantTemplateRepository;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class PlantSuggestionController extends AbstractController
{
    #[Route('/api/suggestions/plants', name: 'api_plants_suggestions', methods: ['GET'])]
    public function suggestions(Request $request, PlantTemplateRepository $plantTemplateRepository, CacheItemPoolInterface $cache): JsonResponse
    {
        $month = (int) $request->query->get('month', date('n'));
        $owner = $this->getUser();
        $ownerId = $owner?->getId() ?? (int)($_ENV['SUGGESTION_OWNER_ID'] ?? 1);
        
        $season = match (true) {
            in_array($month, [3, 4, 5], true) => 'Printemps',
            in_array($month, [6, 7, 8], true) => 'Été',
            in_array($month, [9, 10, 11], true) => 'Automne',
            in_array($month, [12, 1, 2], true) => 'Hiver',
            default => 'Printemps'
        };
        // Cache + déduplication par nom pour la saison
        $cacheKey = 'plant_suggestions_user_' . $ownerId . '_' . $season;
        $cacheItem = $cache->getItem($cacheKey);
        if (!$cacheItem->isHit()) {
            $sub = $plantTemplateRepository->createQueryBuilder('pt2')
                ->select('MAX(pt2.id)')
                ->andWhere('pt2.bestSeason = :season')
                ->andWhere('pt2.user = :owner')
                ->groupBy('pt2.name');

            $qb = $plantTemplateRepository->createQueryBuilder('pt');
            $expr = $qb->expr();
            $qb->andWhere('pt.bestSeason = :season')
               ->andWhere('pt.user = :owner')
               ->andWhere($expr->in('pt.id', $sub->getDQL()))
               ->setParameter('season', $season)
               ->setParameter('owner', $ownerId)
               ->add('orderBy', "CASE pt.type WHEN 'Fruit' THEN 1 WHEN 'Légume' THEN 2 WHEN 'Herbe' THEN 3 ELSE 4 END, pt.name ASC");

            $plantTemplates = $qb->getQuery()->getResult();
            $suggestions = array_map(fn(PlantTemplate $plantTemplate) => [
                'id' => $plantTemplate->getId(),
                'name' => $plantTemplate->getName(),
                'type' => $plantTemplate->getType(),
                'bestSeason' => $plantTemplate->getBestSeason(),
                'wateringFrequency' => $plantTemplate->getWateringFrequency(),
                'sunExposure' => $plantTemplate->getSunExposure(),
                'imageSlug' => $plantTemplate->getImageSlug(),
            ], $plantTemplates);
            $cacheItem->set($suggestions);
            $cacheItem->expiresAfter(300);
            $cache->save($cacheItem);
        } else {
            $suggestions = $cacheItem->get();
        }
        
        $monthNames = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];
        
        $data = [
            'currentMonth' => $monthNames[$month] ?? 'Inconnu',
            'currentSeason' => $season,
            'suggestions' => $suggestions ?? [],
        ];
        
        return $this->json($data);
    }
}