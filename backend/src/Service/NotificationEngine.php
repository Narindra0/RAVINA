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
            $created += $this->handleUpcomingPlanting($plantation, $today, $startDateImmutable);

            if ($today < $startDateImmutable) {
                return $created;
            }
        }

        $daily = $this->extractDaily($meteoData);
        $todayWeather = $daily[0] ?? null;
        $tomorrowWeather = $daily[1] ?? null;

        $created += $this->handleHeatAlert($plantation, $today, $todayWeather);
        $created += $this->handleRainPostpone($plantation, $today, $todayWeather, $tomorrowWeather, $lastSnapshot);
        $created += $this->handleMissedWatering($plantation, $today, $lastSnapshot);

        return $created;
    }

    private function handleUpcomingPlanting(UserPlantation $plantation, \DateTimeImmutable $today, \DateTimeImmutable $startDate): int
    {
        if ($startDate <= $today) {
            return 0;
        }

        $daysUntilStart = (int) $today->diff($startDate)->days;
        if ($daysUntilStart < 2 || $daysUntilStart > 3) {
            return 0;
        }

        $since = $today->sub(new \DateInterval('P5D'));
        if ($this->notificationRepository->hasRecentNotification($plantation, 'PLANTATION_IMMINENTE', $since)) {
            return 0;
        }

        $title = sprintf('Plantation imminente pour %s', $this->resolvePlantName($plantation));
        $message = sprintf(
            "Votre plantation est prévue le %s. Préparez le matériel et vérifiez vos conditions de culture.",
            $startDate->format('d/m/Y')
        );

        $this->createNotification(
            $plantation,
            'PLANTATION_IMMINENTE',
            Notification::PRIORITY_INFO,
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

        return $notification;
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

