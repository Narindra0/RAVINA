<?php

namespace App\Controller;

use App\Entity\UserPlantation;
use App\Repository\UserPlantationRepository;
use App\Service\LifecycleService;
use App\Service\MeteoService;
use App\Service\WateringService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ConfirmPlantingController extends AbstractController
{
    public function __construct(
        private readonly UserPlantationRepository $repository,
        private readonly EntityManagerInterface $entityManager,
        private readonly MeteoService $meteoService,
        private readonly LifecycleService $lifecycleService,
        private readonly WateringService $wateringService,
    ) {
    }

    #[Route('/api/plantations/{id}/confirm-planting', name: 'app_plantations_confirm_planting', methods: ['POST'])]
    public function __invoke(int $id, Request $request): JsonResponse
    {
        $plantation = $this->repository->find($id);
        if (!$plantation instanceof UserPlantation) {
            return $this->json(['detail' => 'Plantation introuvable.'], 404);
        }
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        if ($plantation->getUser() !== $this->getUser()) {
            return $this->json(['detail' => 'Accès refusé.'], 403);
        }

        // Vérifier que la plantation n'a pas déjà été confirmée
        if ($plantation->isPlantationConfirmee()) {
            return $this->json([
                'status' => 'ok',
                'message' => 'Plantation déjà confirmée.',
                'date_confirmation' => $plantation->getDatePlantationConfirmee()?->format('Y-m-d H:i:s'),
            ], 200);
        }

        $startDate = $plantation->getDatePlantation();
        $startDateImmutable = $startDate instanceof \DateTimeInterface ? \DateTimeImmutable::createFromInterface($startDate) : null;
        $today = new \DateTimeImmutable('today');

        // Confirmer la plantation
        $plantation->setDatePlantationConfirmee(new \DateTimeImmutable());

        // Si la date de plantation est passée ou aujourd'hui, créer le premier snapshot
        if ($startDateImmutable && $today >= $startDateImmutable) {
            $lastSnapshot = $plantation->getSuiviSnapshots()->first() ?: null;

            $meteo = $this->meteoService->fetchDailyForecast(
                (float) $plantation->getGeolocalisationLat(),
                (float) $plantation->getGeolocalisationLon()
            );
            $lifecycle = $this->lifecycleService->compute($plantation);
            $watering = $this->wateringService->compute($plantation, $meteo, $lastSnapshot instanceof \App\Entity\SuiviSnapshot ? $lastSnapshot : null);

            $snapshot = new \App\Entity\SuiviSnapshot();
            $snapshot->setUserPlantation($plantation);
            $snapshot->setDateSnapshot(new \DateTimeImmutable());
            $snapshot->setProgressionPourcentage(sprintf('%.2f', $lifecycle['progression']));
            $snapshot->setStadeActuel((string) $lifecycle['stage']);
            $snapshot->setArrosageRecoDate($watering['date']);
            $snapshot->setArrosageRecoQuantiteMl(sprintf('%.2f', $watering['quantity']));
            $snapshot->setDecisionDetailsJson([
                'lifecycle' => $lifecycle['details'] ?? [],
                'watering_notes' => array_merge(['Plantation confirmée'], $watering['notes'] ?? []),
                'manual' => false,
                'frequency_days' => $watering['frequency_days'] ?? null,
            ]);
            $snapshot->setMeteoDataJson([
                'daily' => $meteo['daily'] ?? [],
                'error' => $meteo['error'] ?? null,
            ]);

            $this->entityManager->persist($snapshot);
            $plantation->addSuiviSnapshot($snapshot);
        }

        $this->entityManager->flush();

        return $this->json([
            'status' => 'ok',
            'message' => 'Plantation confirmée avec succès.',
            'date_confirmation' => $plantation->getDatePlantationConfirmee()?->format('Y-m-d H:i:s'),
        ], 201);
    }
}

