<?php

namespace App\Command;

use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;
use App\Repository\UserPlantationRepository;
use App\Service\LifecycleService;
use App\Service\MeteoService;
use App\Service\NotificationEngine;
use App\Service\WateringService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:plantations:process', description: 'Met à jour quotidiennement les suivis de plantations actives.')]
class ProcessPlantationsCommand extends Command
{
    public function __construct(
        private readonly UserPlantationRepository $plantationRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly MeteoService $meteoService,
        private readonly LifecycleService $lifecycleService,
        private readonly WateringService $wateringService,
        private readonly NotificationEngine $notificationEngine,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $plantations = $this->plantationRepository->createQueryBuilder('p')
            ->where('p.etatActuel = :status')
            ->setParameter('status', UserPlantation::STATUS_ACTIVE)
            ->getQuery()
            ->getResult();

        if ($plantations === []) {
            $io->success('Aucune plantation active à traiter.');
            return Command::SUCCESS;
        }

        $today = new \DateTimeImmutable('today');
        $processed = 0;
        $notificationsCreated = 0;
        $hasChanges = false;

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

            $createdForPlantation = $this->notificationEngine->evaluate($plantation, $meteo, $lastSnapshot);
            $notificationsCreated += $createdForPlantation;
            if ($createdForPlantation > 0) {
                $hasChanges = true;
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

        $io->success(sprintf('%d plantation(s) traitée(s), %d notification(s) générée(s).', $processed, $notificationsCreated));

        return Command::SUCCESS;
    }
}


