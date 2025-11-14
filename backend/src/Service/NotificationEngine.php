<?php

namespace App\Service;

use App\Entity\Notification;
use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;

class NotificationEngine
{
    public function __construct(
        private readonly NotificationRepository $notificationRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly WhatsAppNotifier $whatsAppNotifier,
    ) {
    }

    /**
     * @param array<string, mixed> $meteoData
     */
    public function evaluate(UserPlantation $plantation, array $meteoData, ?SuiviSnapshot $lastSnapshot = null): int
    {
        $created = 0;
        $today = new \DateTimeImmutable('today');
        $startDate = $plantation->getDatePlantation();
        $startDateImmutable = $startDate instanceof \DateTimeInterface ? $this->toImmutable($startDate) : null;

        if ($startDateImmutable) {
            // Ne pas envoyer de notifications si la plantation est déjà confirmée
            if (!$plantation->isPlantationConfirmee()) {
                $created += $this->handleUpcomingPlanting($plantation, $today, $startDateImmutable);
                $created += $this->handlePlantingReminder($plantation, $today, $startDateImmutable);
            }

            if ($today < $startDateImmutable) {
                return $created;
            }
        }

        $daily = $this->extractDaily($meteoData);
        $todayWeather = $daily[0] ?? null;
        $tomorrowWeather = $daily[1] ?? null;

        $created += $this->handleFrostAlert($plantation, $today, $todayWeather);
        $created += $this->handleHeatAlert($plantation, $today, $todayWeather);
        $created += $this->handleHeatWaveProactive($plantation, $today, $daily, $lastSnapshot);
        $created += $this->handleRainPostpone($plantation, $today, $todayWeather, $tomorrowWeather, $lastSnapshot);
        $created += $this->handleExcessRainWarning($plantation, $today, $daily);
        $created += $this->handleMissedWatering($plantation, $today, $lastSnapshot);
        $created += $this->handleFertilizationReminder($plantation, $today);
        $created += $this->handleWateringToday($plantation, $today, $lastSnapshot);
        $created += $this->handleWateringReminder($plantation, $lastSnapshot);

        return $created;
    }

    /**
     * @param array<string, mixed>|null $weather
     */
    private function handleFrostAlert(UserPlantation $plantation, \DateTimeImmutable $today, ?array $weather): int
    {
        if (!$weather || !$this->isOutdoor($plantation)) {
            return 0;
        }

        $minTemp = $weather['temperature_min'] ?? null;
        if ($minTemp === null || $minTemp > 2) {
            return 0;
        }

        $since = $today->sub(new \DateInterval('P1D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'ALERTE_GEL', $since)) {
            return 0;
        }

        $priority = $minTemp <= -2 ? Notification::PRIORITY_URGENT : Notification::PRIORITY_IMPORTANT;
        $title = sprintf('Risque de gel pour %s', $this->resolvePlantName($plantation));
        $message = sprintf(
            "La température minimale attendue descend jusqu’à %s°C. Protégez la plante pour éviter les dégâts.",
            $this->formatTemperature($minTemp)
        );

        $this->createNotification(
            $plantation,
            'ALERTE_GEL',
            $priority,
            $title,
            $message
        );

        return 1;
    }

    private function handleUpcomingPlanting(UserPlantation $plantation, \DateTimeImmutable $today, \DateTimeImmutable $startDate): int
    {
        if ($startDate <= $today) {
            return 0;
        }

        $daysUntilStart = (int) $today->diff($startDate)->days;
        $plantName = $this->resolvePlantName($plantation);
        $created = 0;

        // Notification 2 jours avant
        if ($daysUntilStart === 2) {
            $since = $today->sub(new \DateInterval('P1D'));
            if (!$this->notificationRepository->hasRecentNotification($plantation, 'RAPPEL_PLANTATION_2J', $since)) {
                $title = '2 jours avant plantation, préparez-vous';
                $message = sprintf(
                    '2 jours avant plantation, préparez-vous. Votre %s est prévue pour le %s.',
                    $plantName,
                    $startDate->format('d/m/Y')
                );

                $this->createNotification(
                    $plantation,
                    'RAPPEL_PLANTATION_2J',
                    Notification::PRIORITY_INFO,
                    $title,
                    $message
                );
                $created++;
            }
        }

        // Notification 1 jour avant
        if ($daysUntilStart === 1) {
            $since = $today->sub(new \DateInterval('P1D'));
            if (!$this->notificationRepository->hasRecentNotification($plantation, 'RAPPEL_PLANTATION_1J', $since)) {
                $title = sprintf('Plantation de la %s prévue pour demain, préparez-vous', $plantName);
                $message = sprintf(
                    'Plantation de la %s prévue pour demain, préparez-vous.',
                    $plantName
                );

                $this->createNotification(
                    $plantation,
                    'RAPPEL_PLANTATION_1J',
                    Notification::PRIORITY_IMPORTANT,
                    $title,
                    $message
                );
                $created++;
            }
        }

        return $created;
    }

    /**
     * Gère les rappels en cas de retard de plantation
     */
    private function handlePlantingReminder(UserPlantation $plantation, \DateTimeImmutable $today, \DateTimeImmutable $startDate): int
    {
        // Ne pas envoyer de rappel si la plantation est déjà confirmée
        if ($plantation->isPlantationConfirmee()) {
            return 0;
        }

        // Ne pas envoyer de rappel si la date n'est pas encore passée
        if ($startDate > $today) {
            return 0;
        }

        $daysLate = (int) $startDate->diff($today)->days;
        if ($daysLate <= 0) {
            return 0;
        }

        // Envoyer un rappel tous les jours après la date prévue
        $since = $today->sub(new \DateInterval('P1D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'RAPPEL_PLANTATION_RETARD', $since)) {
            return 0;
        }

        $plantName = $this->resolvePlantName($plantation);
        $title = sprintf('Rappel : plantation de la %s en retard', $plantName);
        $message = sprintf(
            'Plantation prévue, il y a %d jour%s... Vous avez oublié ? N\'oubliez pas de confirmer votre plantation.',
            $daysLate,
            $daysLate > 1 ? 's' : ''
        );

        $this->createNotification(
            $plantation,
            'RAPPEL_PLANTATION_RETARD',
            Notification::PRIORITY_IMPORTANT,
            $title,
            $message
        );

        return 1;
    }

    /**
     * @param array<string, mixed>|null $weather
     */
    private function handleHeatAlert(UserPlantation $plantation, \DateTimeImmutable $today, ?array $weather): int
    {
        if (!$weather || !$this->isOutdoor($plantation) || !$this->isHeatSensitive($plantation)) {
            return 0;
        }

        $maxTemp = $weather['temperature_max'] ?? null;
        if ($maxTemp === null || $maxTemp < 32) {
            return 0;
        }

        $since = $today->sub(new \DateInterval('P1D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'ALERTE_CHALEUR', $since)) {
            return 0;
        }

        $priority = $maxTemp >= 35 ? Notification::PRIORITY_URGENT : Notification::PRIORITY_IMPORTANT;
        $title = sprintf('Alerte chaleur pour %s', $this->resolvePlantName($plantation));
        $message = sprintf(
            "La température attendue aujourd'hui atteint %s°C. %sPensez à arroser légèrement et à offrir de l'ombre.",
            $this->formatTemperature($maxTemp),
            $this->isOutdoor($plantation) ? '' : ''
        );

        $this->createNotification(
            $plantation,
            'ALERTE_CHALEUR',
            $priority,
            $title,
            $message
        );

        return 1;
    }

    /**
     * @param array<int, array<string, mixed>> $daily
     */
    private function handleHeatWaveProactive(
        UserPlantation $plantation,
        \DateTimeImmutable $today,
        array $daily,
        ?SuiviSnapshot $lastSnapshot
    ): int {
        if (!$this->isOutdoor($plantation) || !$this->isHeatSensitive($plantation)) {
            return 0;
        }

        $hotDays = 0;
        foreach (array_slice($daily, 0, 3) as $forecast) {
            $max = $forecast['temperature_max'] ?? null;
            if ($max !== null && $max >= 30) {
                $hotDays++;
            }
        }

        if ($hotDays < 2) {
            return 0;
        }

        $nextWatering = $lastSnapshot?->getArrosageRecoDate();
        if (!$nextWatering instanceof \DateTimeInterface) {
            return 0;
        }

        $nextWatering = $this->toImmutable($nextWatering);
        if ($nextWatering <= $today->add(new \DateInterval('P1D'))) {
            return 0;
        }

        $since = $today->sub(new \DateInterval('P2D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'VIGILANCE_CHALEUR_PROLONGEE', $since)) {
            return 0;
        }

        $title = sprintf('Chaleur prolongée : anticipez l’arrosage (%s)', $this->resolvePlantName($plantation));
        $message = sprintf(
            "Plusieurs journées > 30°C sont prévues. Surveillez l’humidité et prévoyez un arrosage léger avant le %s.",
            $nextWatering->format('d/m/Y')
        );

        $this->createNotification(
            $plantation,
            'VIGILANCE_CHALEUR_PROLONGEE',
            Notification::PRIORITY_IMPORTANT,
            $title,
            $message
        );

        return 1;
    }

    /**
     * @param array<string, mixed>|null $todayWeather
     * @param array<string, mixed>|null $tomorrowWeather
     */
    private function handleRainPostpone(
        UserPlantation $plantation,
        \DateTimeImmutable $today,
        ?array $todayWeather,
        ?array $tomorrowWeather,
        ?SuiviSnapshot $lastSnapshot
    ): int {
        if (!$lastSnapshot) {
            return 0;
        }

        $recommendedDate = $lastSnapshot->getArrosageRecoDate();
        if (!$recommendedDate instanceof \DateTimeInterface) {
            return 0;
        }

        $recommendedDate = $this->toImmutable($recommendedDate);
        if ($recommendedDate->format('Y-m-d') !== $today->format('Y-m-d')) {
            return 0;
        }

        $rainToday = $todayWeather['precipitation_sum'] ?? 0;
        if (!is_numeric($rainToday) || (float) $rainToday < 2.0) {
            return 0;
        }

        $since = $today->sub(new \DateInterval('P1D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'REPORT_ARROSAGE', $since)) {
            return 0;
        }

        $reportDays = (float) $rainToday >= 8 ? 2 : 1;
        $rainTomorrow = $tomorrowWeather['precipitation_sum'] ?? null;
        if (is_numeric($rainTomorrow) && (float) $rainTomorrow >= 7) {
            $reportDays = max($reportDays, 2);
        }

        $newDate = $recommendedDate->add(new \DateInterval(sprintf('P%dD', $reportDays)));
        $priority = $reportDays > 1 ? Notification::PRIORITY_IMPORTANT : Notification::PRIORITY_INFO;

        $title = sprintf('Pluie prévue : report d’arrosage (%s)', $this->resolvePlantName($plantation));
        $message = sprintf(
            "Des précipitations de %s mm sont attendues aujourd'hui. Reportez l’arrosage au %s.",
            $this->formatPrecipitation((float) $rainToday),
            $newDate->format('d/m/Y')
        );

        $this->createNotification(
            $plantation,
            'REPORT_ARROSAGE',
            $priority,
            $title,
            $message
        );

        return 1;
    }

    /**
     * @param array<int, array<string, mixed>> $daily
     */
    private function handleExcessRainWarning(
        UserPlantation $plantation,
        \DateTimeImmutable $today,
        array $daily
    ): int {
        if (!$this->isOutdoor($plantation)) {
            return 0;
        }

        $todayRain = (float) ($daily[0]['precipitation_sum'] ?? 0);
        $tomorrowRain = (float) ($daily[1]['precipitation_sum'] ?? 0);

        if ($todayRain < 15 && ($todayRain + $tomorrowRain) < 25) {
            return 0;
        }

        $since = $today->sub(new \DateInterval('P2D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'SURVEILLANCE_PLUIE', $since)) {
            return 0;
        }

        $title = sprintf('Pluie abondante : surveillez le drainage (%s)', $this->resolvePlantName($plantation));
        $message = sprintf(
            "Entre aujourd’hui et demain, %s mm de pluie sont attendus. Vérifiez l’évacuation de l’eau et évitez les soucoupes pleines.",
            $this->formatPrecipitation($todayRain + $tomorrowRain)
        );

        $this->createNotification(
            $plantation,
            'SURVEILLANCE_PLUIE',
            Notification::PRIORITY_INFO,
            $title,
            $message
        );

        return 1;
    }

    private function handleMissedWatering(UserPlantation $plantation, \DateTimeImmutable $today, ?SuiviSnapshot $lastSnapshot): int
    {
        if (!$lastSnapshot) {
            return 0;
        }

        $recommendedDate = $lastSnapshot->getArrosageRecoDate();
        if (!$recommendedDate instanceof \DateTimeInterface) {
            return 0;
        }

        $recommendedDate = $this->toImmutable($recommendedDate);
        $threshold = $today->sub(new \DateInterval('P2D'));

        if ($recommendedDate > $threshold) {
            return 0;
        }

        if ($this->notificationRepository->hasUnreadNotification($plantation, 'ARROSAGE_URGENCE')) {
            return 0;
        }

        if ($this->hasManualWateringSince($plantation, $recommendedDate)) {
            return 0;
        }

        $title = sprintf('Arrosage en retard (%s)', $this->resolvePlantName($plantation));
        $message = sprintf(
            "L’arrosage prévu le %s n’a pas été effectué. Donnez de l’eau dès que possible%s.",
            $recommendedDate->format('d/m/Y'),
            $this->isOutdoor($plantation) ? ', surtout en extérieur' : ''
        );

        $this->createNotification(
            $plantation,
            'ARROSAGE_URGENCE',
            Notification::PRIORITY_URGENT,
            $title,
            $message
        );

        return 1;
    }

    private function handleFertilizationReminder(UserPlantation $plantation, \DateTimeImmutable $today): int
    {
        $startDate = $plantation->getDatePlantation();
        $startDate = $startDate instanceof \DateTimeInterface ? $this->toImmutable($startDate) : null;
        if (!$startDate) {
            return 0;
        }

        $daysSinceStart = $startDate->diff($today)->days;
        if ($daysSinceStart === 0 || $daysSinceStart % 30 !== 0) {
            return 0;
        }

        $since = $today->sub(new \DateInterval('P7D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'RAPPEL_FERTILISATION', $since)) {
            return 0;
        }

        $title = sprintf('Pensez à fertiliser (%s)', $this->resolvePlantName($plantation));
        $message = sprintf(
            "Cela fait %d jours que la plantation a commencé. Apportez un engrais adapté pour soutenir sa croissance.",
            $daysSinceStart
        );

        $this->createNotification(
            $plantation,
            'RAPPEL_FERTILISATION',
            Notification::PRIORITY_INFO,
            $title,
            $message
        );

        return 1;
    }

    /**
     * Notification matinale : "Arrosage du {nom} aujourd'hui"
     * Envoyée le matin (avant 12h00) si l'arrosage est prévu aujourd'hui et qu'il n'a pas encore été fait
     */
    private function handleWateringToday(UserPlantation $plantation, \DateTimeImmutable $today, ?SuiviSnapshot $lastSnapshot): int
    {
        if (!$lastSnapshot) {
            return 0;
        }

        $recommendedDate = $lastSnapshot->getArrosageRecoDate();
        if (!$recommendedDate instanceof \DateTimeInterface) {
            return 0;
        }

        $recommendedDate = $this->toImmutable($recommendedDate);

        // Vérifier si l'arrosage est prévu aujourd'hui
        if ($recommendedDate->format('Y-m-d') !== $today->format('Y-m-d')) {
            return 0;
        }

        // Vérifier qu'aucun arrosage manuel n'a déjà été fait aujourd'hui
        if ($this->hasManualWateringSince($plantation, $today)) {
            return 0;
        }

        // Vérifier qu'on n'a pas déjà envoyé cette notification aujourd'hui
        $since = $today->sub(new \DateInterval('P1D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'RAPPEL_ARROSAGE_AUJOURD_HUI', $since)) {
            return 0;
        }

        // Vérifier l'heure : on envoie seulement le matin (avant 12h00)
        $now = new \DateTimeImmutable();
        $currentHour = (int) $now->format('H');
        if ($currentHour >= 12) {
            return 0; // Trop tard, on ne l'envoie que le matin
        }

        $plantName = $this->resolvePlantName($plantation);
        $title = sprintf('Arrosage du %s aujourd\'hui', $plantName);
        $message = sprintf(
            'N\'oubliez pas d\'arroser votre %s aujourd\'hui.',
            $plantName
        );

        $this->createNotification(
            $plantation,
            'RAPPEL_ARROSAGE_AUJOURD_HUI',
            Notification::PRIORITY_IMPORTANT,
            $title,
            $message
        );

        return 1;
    }

    /**
     * Rappel en fin d'après-midi : "N'oubliez pas d'arroser votre {nom}"
     * Envoyée entre 15h30 et 17h30 si l'arrosage était prévu aujourd'hui et n'a pas encore été fait
     */
    private function handleWateringReminder(UserPlantation $plantation, ?SuiviSnapshot $lastSnapshot): int
    {
        if (!$lastSnapshot) {
            return 0;
        }

        $recommendedDate = $lastSnapshot->getArrosageRecoDate();
        if (!$recommendedDate instanceof \DateTimeInterface) {
            return 0;
        }

        $recommendedDate = $this->toImmutable($recommendedDate);
        $now = new \DateTimeImmutable();
        $today = new \DateTimeImmutable('today');

        // Vérifier si l'arrosage est prévu aujourd'hui
        if ($recommendedDate->format('Y-m-d') !== $today->format('Y-m-d')) {
            return 0;
        }

        // Vérifier qu'aucun arrosage manuel n'a déjà été fait aujourd'hui
        if ($this->hasManualWateringSince($plantation, $today)) {
            return 0;
        }

        // Vérifier l'heure : on envoie seulement entre 15h30 et 17h30
        $currentHour = (int) $now->format('H');
        $currentMinute = (int) $now->format('i');

        if ($currentHour < 15 || ($currentHour === 15 && $currentMinute < 30)) {
            return 0; // Trop tôt, on attend 15h30
        }

        if ($currentHour > 17 || ($currentHour === 17 && $currentMinute > 30)) {
            return 0; // Trop tard, on ne l'envoie qu'entre 15h30 et 17h30
        }

        // Vérifier qu'on n'a pas déjà envoyé ce rappel aujourd'hui
        $since = $today->sub(new \DateInterval('P1D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'RAPPEL_ARROSAGE_SOIR', $since)) {
            return 0;
        }

        $plantName = $this->resolvePlantName($plantation);
        $title = sprintf('N\'oubliez pas d\'arroser votre %s', $plantName);
        $message = sprintf(
            'Votre %s doit être arrosé aujourd\'hui. Pensez à le faire si ce n\'est pas déjà fait.',
            $plantName
        );

        $this->createNotification(
            $plantation,
            'RAPPEL_ARROSAGE_SOIR',
            Notification::PRIORITY_IMPORTANT,
            $title,
            $message
        );

        return 1;
    }

    private function createNotification(
        UserPlantation $plantation,
        string $type,
        string $priority,
        string $title,
        string $message
    ): Notification {
        $notification = new Notification();
        $notification->setUserPlantation($plantation);
        $notification->setTypeConseil($type);
        $notification->setNiveauPriorite($priority);
        $notification->setTitre($title);
        $notification->setMessageDetaille($message);
        $notification->setStatutLecture(false);

        $plantation->addNotification($notification);
        $this->entityManager->persist($notification);
        $this->dispatchWhatsApp($plantation, $title, $message);

        return $notification;
    }

    private function dispatchWhatsApp(UserPlantation $plantation, string $title, string $message): void
    {
        $user = $plantation->getUser();
        if (!$user) {
            return;
        }

        $this->whatsAppNotifier->sendNotification($user->getNumeroTelephone(), $title, $message);
    }

    /**
     * @param array<string, mixed> $meteoData
     * @return array<int, array<string, mixed>>
     */
    private function extractDaily(array $meteoData): array
    {
        $daily = $meteoData['daily'] ?? [];
        return is_array($daily) ? $daily : [];
    }

    private function isOutdoor(UserPlantation $plantation): bool
    {
        $location = mb_strtolower((string) $plantation->getLocalisation());
        foreach (['balcon', 'terrasse', 'jardin', 'extérieur', 'exterieur', 'patio', 'cour'] as $keyword) {
            if (str_contains($location, $keyword)) {
                return true;
            }
        }

        $templateLocation = mb_strtolower((string) $plantation->getPlantTemplate()?->getLocation());
        foreach (['exterieur', 'extérieur', 'plein air'] as $keyword) {
            if (str_contains($templateLocation, $keyword)) {
                return true;
            }
        }

        return false;
    }

    private function isHeatSensitive(UserPlantation $plantation): bool
    {
        $sunExposure = mb_strtolower((string) $plantation->getPlantTemplate()?->getSunExposure());
        if ($sunExposure === '') {
            return true;
        }

        if (str_contains($sunExposure, 'ombre') || str_contains($sunExposure, 'shadow')) {
            return true;
        }

        if (str_contains($sunExposure, 'mi-ombre') || str_contains($sunExposure, 'partielle')) {
            return true;
        }

        return false;
    }

    private function hasManualWateringSince(UserPlantation $plantation, \DateTimeImmutable $since): bool
    {
        foreach ($plantation->getSuiviSnapshots() as $snapshot) {
            $snapshotDate = $snapshot->getDateSnapshot();
            if (!$snapshotDate instanceof \DateTimeInterface) {
                continue;
            }

            if ($snapshotDate < $since) {
                break;
            }

            $details = $snapshot->getDecisionDetailsJson();
            if (is_array($details) && ($details['manual'] ?? false) === true) {
                return true;
            }
        }

        return false;
    }

    private function resolvePlantName(UserPlantation $plantation): string
    {
        $template = $plantation->getPlantTemplate();
        $name = $template?->getName() ?? 'votre plante';

        return $name;
    }

    private function toImmutable(\DateTimeInterface $value): \DateTimeImmutable
    {
        return $value instanceof \DateTimeImmutable ? $value : \DateTimeImmutable::createFromInterface($value);
    }

    private function formatTemperature(float $value): string
    {
        return number_format($value, 1, ',', ' ');
    }

    private function formatPrecipitation(float $value): string
    {
        return number_format($value, 1, ',', ' ');
    }
}

