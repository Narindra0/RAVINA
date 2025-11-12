<?php
namespace App\Controller;

use App\Entity\PlantTemplate;
use App\Repository\PlantTemplateRepository;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\DBAL\Connection;

class PlantSuggestionController extends AbstractController
{
    #[Route('/api/suggestions/plants', name: 'api_plants_suggestions', methods: ['GET'])]
    public function suggestions(Request $request, PlantTemplateRepository $plantTemplateRepository, CacheItemPoolInterface $cache): JsonResponse
    {
        $month = (int) $request->query->get('month', date('n'));
        $owner = $this->getUser();
        $fallbackOwnerId = (int)($_ENV['SUGGESTION_OWNER_ID'] ?? 1);
        $eligibleOwnerIds = array_values(array_unique(array_filter([
            $fallbackOwnerId ?: null,
            $owner?->getId(),
        ], static fn ($value) => $value !== null)));
        if (empty($eligibleOwnerIds)) {
            $eligibleOwnerIds = [$fallbackOwnerId ?: 1];
        }
        
        $season = match (true) {
            in_array($month, [3, 4, 5], true) => 'Printemps',
            in_array($month, [6, 7, 8], true) => 'Été',
            in_array($month, [9, 10, 11], true) => 'Automne',
            in_array($month, [12, 1, 2], true) => 'Hiver',
            default => 'Printemps'
        };

        $normalize = static function (?string $value): ?string {
            if ($value === null) {
                return null;
            }
            $value = str_replace(['’', '‘'], "'", $value);
            $value = trim($value);
            return mb_strtolower($value, 'UTF-8');
        };

        $seasonAliases = [
            'printemps' => ['Printemps', 'printemps', 'Spring', 'spring'],
            'été' => ['Été', 'Ete', 'été', 'ete', 'Summer', 'summer'],
            'automne' => ['Automne', 'automne', 'Fall', 'fall'],
            'hiver' => ['Hiver', 'hiver', 'Winter', 'winter'],
            "toute l'année" => [
                "Toute l'année",
                "Toute l’annee",
                "toute l'année",
                "toute l’annee",
                "toute l'annee",
                "toute lannee",
                'all year',
                'année entière',
                'annee entiere',
                'annuel',
            ],
        ];

        $normalizedAliases = [];
        foreach ($seasonAliases as $key => $values) {
            $normalizedKey = $normalize($key);
            $normalizedValues = array_filter(array_map(static function (string $value) use ($normalize) {
                return $normalize($value);
            }, $values));
            $normalizedAliases[$normalizedKey] = array_values(array_unique($normalizedValues));
        }

        $seasonKey = $normalize($season) ?? 'printemps';
        $allYearKey = $normalize("Toute l'année");

        $seasonLabels = $normalizedAliases[$seasonKey] ?? [$seasonKey];
        $allYearLabels = $normalizedAliases[$allYearKey] ?? [$allYearKey];
        // Cache + déduplication par nom pour la saison
        $cacheKey = 'plant_suggestions_' . implode('_', $eligibleOwnerIds) . '_' . $seasonKey;
        $cacheItem = $cache->getItem($cacheKey);
        $suggestions = $cacheItem->get();
        if (!$cacheItem->isHit()) {
            $sub = $plantTemplateRepository->createQueryBuilder('pt2');
            $subExpr = $sub->expr();
            $sub = $sub
                ->select('MAX(pt2.id)')
                ->andWhere(
                    $subExpr->in(
                        'pt2.user',
                        ':eligibleOwners'
                    )
                )
                ->andWhere(
                    $subExpr->orX(
                        $subExpr->in('LOWER(pt2.bestSeason)', ':seasonLabels'),
                        $subExpr->in('LOWER(pt2.bestSeason)', ':allYearLabels')
                    )
                )
                ->groupBy('pt2.name')
                ->setParameter('eligibleOwners', $eligibleOwnerIds, Connection::PARAM_INT_ARRAY)
                ->setParameter('seasonLabels', $seasonLabels, Connection::PARAM_STR_ARRAY)
                ->setParameter('allYearLabels', $allYearLabels, Connection::PARAM_STR_ARRAY);

            $qb = $plantTemplateRepository->createQueryBuilder('pt');
            $expr = $qb->expr();
            $qb->andWhere(
                $expr->in(
                    'pt.user',
                    ':eligibleOwners'
                )
            )
               ->andWhere(
                   $expr->orX(
                       $expr->in('LOWER(pt.bestSeason)', ':seasonLabels'),
                       $expr->in('LOWER(pt.bestSeason)', ':allYearLabels')
                   )
               )
               ->andWhere($expr->in('pt.id', $sub->getDQL()))
               ->setParameter('eligibleOwners', $eligibleOwnerIds, Connection::PARAM_INT_ARRAY)
               ->setParameter('seasonLabels', $seasonLabels, Connection::PARAM_STR_ARRAY)
               ->setParameter('allYearLabels', $allYearLabels, Connection::PARAM_STR_ARRAY)
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