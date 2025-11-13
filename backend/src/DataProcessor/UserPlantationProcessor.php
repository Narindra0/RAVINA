<?php

namespace App\DataProcessor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Notification;
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
        if ($startDateImmutable && $startDateImmutable < $today) {
            $retroactiveDays = $startDateImmutable->diff($today)->days;
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
        $snapshot->setDecisionDetailsJson($details);
        $snapshot->setMeteoDataJson([
            'daily' => $meteo['daily'] ?? [],
            'error' => $meteo['error'] ?? null,
        ]);

        $data->addSuiviSnapshot($snapshot);

        if ($retroactiveDays > 0) {
            $this->createLateRegistrationNotification($data, $retroactiveDays, $startDateImmutable, $today);
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }

    private function createLateRegistrationNotification(
        UserPlantation $plantation,
        int $retroactiveDays,
        ?\DateTimeImmutable $startDate,
        \DateTimeImmutable $today
    ): void {
        $notification = new Notification();
        $notification->setUserPlantation($plantation);
        $notification->setTypeConseil('ENREGISTREMENT_RETARD');
        $notification->setNiveauPriorite(Notification::PRIORITY_IMPORTANT);

        $plantName = $plantation->getPlantTemplate()?->getName() ?? 'votre plante';
        $notification->setTitre(sprintf('Plantation ajoutée en retard (%s)', $plantName));

        $startLabel = $startDate ? $startDate->format('d/m/Y') : 'date inconnue';
        $message = sprintf(
            "Cette plantation a été enregistrée avec %d jour(s) de décalage. Revoyez les étapes réalisées depuis le %s et mettez à jour votre suivi si nécessaire. Date de régularisation : %s.",
            $retroactiveDays,
            $startLabel,
            $today->format('d/m/Y')
        );
        $notification->setMessageDetaille($message);
        $notification->setStatutLecture(false);

        $plantation->addNotification($notification);
        $this->entityManager->persist($notification);
    }
}


