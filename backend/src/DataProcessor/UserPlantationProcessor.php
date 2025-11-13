<?php

namespace App\DataProcessor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\SuiviSnapshot;
use App\Entity\User;
use App\Entity\UserPlantation;
use App\Service\LifecycleService;
use App\Service\MeteoService;
use App\Service\WateringService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class UserPlantationProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly MeteoService $meteoService,
        private readonly LifecycleService $lifecycleService,
        private readonly WateringService $wateringService,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): UserPlantation
    {
        if (!$data instanceof UserPlantation) {
            throw new \RuntimeException('UserPlantationProcessor ne peut traiter que UserPlantation.');
        }

        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new AccessDeniedException('Authentification requise pour créer une plantation.');
        }

        $data->setUser($user);

        if ($data->getDatePlantation() === null) {
            $data->setDatePlantation(new \DateTimeImmutable('today'));
        }

        if ($data->getEtatActuel() === null) {
            $data->setEtatActuel(UserPlantation::STATUS_ACTIVE);
        }

        $startDate = $data->getDatePlantation();
        $startDateImmutable = $startDate instanceof \DateTimeInterface ? \DateTimeImmutable::createFromInterface($startDate) : null;
        $today = new \DateTimeImmutable('today');

        $latitude = (float) $data->getGeolocalisationLat();
        $longitude = (float) $data->getGeolocalisationLon();

        if ($startDateImmutable && $today < $startDateImmutable) {
            $this->entityManager->persist($data);
            $this->entityManager->flush();

            return $data;
        }

        $meteo = $this->meteoService->fetchDailyForecast($latitude, $longitude);
        $lifecycle = $this->lifecycleService->compute($data);
        $lastSnapshot = $data->getSuiviSnapshots()->first() ?: null;
        if ($lastSnapshot instanceof SuiviSnapshot) {
            // for new entity there should be none, but keep for consistency
        } else {
            $lastSnapshot = null;
        }
        $watering = $this->wateringService->compute($data, $meteo, $lastSnapshot);

        $retroactiveDays = 0;
        if ($startDateImmutable) {
            $diff = $startDateImmutable->diff($today);
            if ($diff->invert === 0) {
                $retroactiveDays = $diff->days;
            }
        }

        $snapshot = new SuiviSnapshot();
        $snapshot->setDateSnapshot(new \DateTimeImmutable());
        $snapshot->setProgressionPourcentage(sprintf('%.2f', $lifecycle['progression']));
        $snapshot->setStadeActuel((string) $lifecycle['stage']);
        $snapshot->setArrosageRecoDate($watering['date']);
        $snapshot->setArrosageRecoQuantiteMl(sprintf('%.2f', $watering['quantity']));
        $details = [
            'lifecycle' => $lifecycle['details'] ?? [],
            'watering_notes' => $watering['notes'] ?? [],
            'frequency_days' => $watering['frequency_days'] ?? null,
        ];
        if ($retroactiveDays > 0) {
            $details['retroactive_days'] = $retroactiveDays;
            $details['retroactive_note'] = sprintf(
                'Création en retard de %d jour(s) : progression recalculée au %s.',
                $retroactiveDays,
                $today->format('d/m/Y')
            );
        }
        $snapshot->setDecisionDetailsJson($details);
        $snapshot->setMeteoDataJson([
            'daily' => $meteo['daily'] ?? [],
            'error' => $meteo['error'] ?? null,
        ]);

        $data->addSuiviSnapshot($snapshot);

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }
}


