<?php

namespace App\Service;

use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;
use App\Repository\UserPlantationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class DailyPlantationsProcessor
{
    public function __construct(
        private readonly UserPlantationRepository $plantationRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly MeteoService $meteoService,
        private readonly LifecycleService $lifecycleService,
        private readonly WateringService $wateringService,
        private readonly NotificationEngine $notificationEngine,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return array{processed:int, notifications:int, total:int}
     */
    public function run(): array
    {
        $today = new \DateTimeImmutable('today');
        $plantations = $this->plantationRepository->createQueryBuilder('p')
            ->where('p.etatActuel = :status')
            ->setParameter('status', UserPlantation::STATUS_ACTIVE)
            ->getQuery()
            ->getResult();

        $total = count($plantations);
        $processed = 0;
        $notificationsCreated = 0;
        $hasChanges = false;

        $this->logger->info('Traitement quotidien des plantations démarré', [
            'total_candidates' => $total,
            'date' => $today->format('Y-m-d'),
        ]);

        foreach ($plantations as $plantation) {
            if (!$plantation instanceof UserPlantation) {
                continue;
            }

            $meteo = $this->meteoService->fetchDailyForecast(
                (float) $plantation->getGeolocalisationLat(),
                (float) $plantation->getGeolocalisationLon()
            );

            $lastSnapshot = $plantation->getSuiviSnapshots()->first();
            $lastSnapshot = $lastSnapshot instanceof SuiviSnapshot ? $lastSnapshot : null;
            $startDate = $plantation->getDatePlantation();
            $startDateImmutable = $startDate instanceof \DateTimeInterface ? \DateTimeImmutable::createFromInterface($startDate) : null;

            $createdForPlantation = $this->notificationEngine->evaluate($plantation, $meteo, $lastSnapshot);
            $notificationsCreated += $createdForPlantation;
            if ($createdForPlantation > 0) {
                $hasChanges = true;
            }

            if ($startDateImmutable && $today < $startDateImmutable) {
                continue;
            }

            if ($lastSnapshot instanceof SuiviSnapshot) {
                $lastDate = $lastSnapshot->getDateSnapshot();
                if ($lastDate instanceof \DateTimeInterface && $lastDate->format('Y-m-d') === $today->format('Y-m-d')) {
                    continue;
                }
            }

            $lifecycle = $this->lifecycleService->compute($plantation);
            $watering = $this->wateringService->compute($plantation, $meteo, $lastSnapshot);

            $snapshot = new SuiviSnapshot();
            $snapshot->setUserPlantation($plantation);
            $snapshot->setDateSnapshot(new \DateTimeImmutable());
            $snapshot->setProgressionPourcentage(sprintf('%.2f', $lifecycle['progression']));
            $snapshot->setStadeActuel((string) $lifecycle['stage']);
            $snapshot->setArrosageRecoDate($watering['date']);
            $snapshot->setArrosageRecoQuantiteMl(sprintf('%.2f', $watering['quantity']));
            $snapshot->setDecisionDetailsJson([
                'lifecycle' => $lifecycle['details'] ?? [],
                'watering_notes' => $watering['notes'] ?? [],
                'frequency_days' => $watering['frequency_days'] ?? null,
            ]);
            $snapshot->setMeteoDataJson([
                'daily' => $meteo['daily'] ?? [],
                'error' => $meteo['error'] ?? null,
            ]);

            $this->entityManager->persist($snapshot);
            $plantation->addSuiviSnapshot($snapshot);
            $processed++;
            $hasChanges = true;
        }

        if ($hasChanges) {
            $this->entityManager->flush();
        }

        $this->logger->info('Traitement quotidien terminé', [
            'processed' => $processed,
            'notifications_created' => $notificationsCreated,
        ]);

        return [
            'processed' => $processed,
            'notifications' => $notificationsCreated,
            'total' => $total,
        ];
    }
}

