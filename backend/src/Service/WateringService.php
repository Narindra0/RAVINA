<?php

namespace App\Service;

use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;

class WateringService
{
    /**
     * @var array<string, float>
     */
    private array $thresholds;

    /**
     * @param array<string, float|int> $thresholds
     */
    public function __construct(array $thresholds = [])
    {
        $defaults = [
            'rain_auto_mm' => 5.0,
            'rain_reduce_mm' => 2.0,
            'rain_tomorrow_postpone_mm' => 7.0,
            'temperature_high_c' => 32.0,
            'temperature_low_c' => 10.0,
        ];

        $this->thresholds = array_map(
            static fn ($value) => (float) $value,
            array_replace($defaults, $thresholds)
        );
    }

    /**
     * @param array<string, mixed> $meteoData
     * @return array<string, mixed>
     */
    public function compute(UserPlantation $plantation, array $meteoData, ?SuiviSnapshot $lastSnapshot = null): array
    {
        $template = $plantation->getPlantTemplate();
        $baseQuantity = (float) ($template?->getWateringQuantityMl() ?? 500);
        $frequencyDays = $this->resolveFrequencyDays((string) $template?->getWateringFrequency());

        $todayDate = new \DateTimeImmutable('today');
        $lastManualWatering = $plantation->getLastManualWateringAt();
        $referenceDate = $lastManualWatering
            ?? $plantation->getDatePlantation()
            ?? $todayDate;

        $referenceDate = $this->toImmutable($referenceDate);

        if ($referenceDate < $todayDate) {
            $referenceDate = $todayDate;
        }

        $interval = new \DateInterval(sprintf('P%dD', $frequencyDays));
        $nextDate = $referenceDate->add($interval);
        $canFastForward = $lastManualWatering instanceof \DateTimeInterface;
        if ($canFastForward) {
            while ($nextDate < $todayDate) {
                $nextDate = $nextDate->add($interval);
            }
        }
        $quantity = $baseQuantity;
        $decisions = [];

        $today = $meteoData['daily'][0] ?? null;
        $tomorrow = $meteoData['daily'][1] ?? null;
        $isOutdoor = $this->isOutdoor($plantation);
        $autoWateredDueToRain = false;
        $heavyRainMessage = sprintf(
            "L'arrosage est reporté en raison des pluies prévues (≥ %s mm) aujourd'hui.",
            $this->formatNumber($this->thresholds['rain_auto_mm'])
        );

        $todayRain = is_array($today) && isset($today['precipitation_sum'])
            ? (float) $today['precipitation_sum']
            : null;

        if ($isOutdoor && $todayRain !== null && $todayRain >= $this->thresholds['rain_auto_mm']) {
            $nextDate = $todayDate->add($interval);
            $decisions = [$heavyRainMessage];
            $autoWateredDueToRain = true;
        } else {
            if ($isOutdoor && $todayRain !== null && $todayRain >= $this->thresholds['rain_reduce_mm']) {
                $quantity *= 0.8;
                $decisions[] = 'Réduction de 20% car pluie modérée attendue.';
            }

            $tomorrowRain = is_array($tomorrow) && isset($tomorrow['precipitation_sum'])
                ? (float) $tomorrow['precipitation_sum']
                : null;

            if ($isOutdoor && $tomorrowRain !== null && $tomorrowRain >= $this->thresholds['rain_tomorrow_postpone_mm']) {
                $nextDate = $nextDate->add(new \DateInterval('P1D'));
                $decisions[] = 'Report supplémentaire (+1 jour) car forte pluie attendue demain.';
            }

            $maxTemp = $today['temperature_max'] ?? null;
            if ($maxTemp !== null) {
                if ($maxTemp >= $this->thresholds['temperature_high_c']) {
                    $quantity *= 1.2;
                    $decisions[] = sprintf(
                        'Augmentation de 20%% car température max >= %s°C.',
                        $this->formatNumber($this->thresholds['temperature_high_c'])
                    );
                } elseif ($maxTemp <= $this->thresholds['temperature_low_c']) {
                    $quantity *= 0.9;
                    $decisions[] = sprintf(
                        'Réduction de 10%% car température max <= %s°C.',
                        $this->formatNumber($this->thresholds['temperature_low_c'])
                    );
                }
            }
        }

        $quantity = round($quantity, 2);

        return [
            'date' => $nextDate,
            'quantity' => $quantity,
            'notes' => $decisions,
            'frequency_days' => $frequencyDays,
            'auto_watered_due_to_rain' => $autoWateredDueToRain,
            'thresholds' => $this->thresholds,
        ];
    }

    private function resolveFrequencyDays(?string $frequency): int
    {
        if ($frequency === null || $frequency === '') {
            return 3;
        }

        $normalized = mb_strtolower($frequency);
        $map = [
            'quotidien' => 1,
            'journalier' => 1,
            'tous les jours' => 1,
            'hebdomadaire' => 7,
            'hebdo' => 7,
            'semaine' => 7,
            'bihebdomadaire' => 3,
            'tous les 2 jours' => 2,
            'toutes les 2 semaines' => 14,
            'mensuel' => 30,
        ];

        foreach ($map as $keyword => $days) {
            if (str_contains($normalized, $keyword)) {
                return $days;
            }
        }

        if (preg_match('/\d+/', $normalized, $matches)) {
            return max(1, (int) $matches[0]);
        }

        return 3;
    }

    private function toImmutable(\DateTimeInterface $dateTime): \DateTimeImmutable
    {
        return $dateTime instanceof \DateTimeImmutable
            ? $dateTime
            : \DateTimeImmutable::createFromInterface($dateTime);
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

    private function formatNumber(float $value): string
    {
        $formatted = number_format($value, 2, '.', '');
        return rtrim(rtrim($formatted, '0'), '.');
    }
}


