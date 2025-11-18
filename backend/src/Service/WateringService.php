<?php

namespace App\Service;

use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;

class WateringService
{
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
        $heavyRainMessage = "L'arrosage est reporté en raison des fortes pluies annoncées aujourd'hui.";

        $todayRain = is_array($today) && isset($today['precipitation_sum'])
            ? (float) $today['precipitation_sum']
            : null;

        if ($isOutdoor && $todayRain !== null && $todayRain >= 5.0) {
            $nextDate = $todayDate->add($interval);
            $decisions = [$heavyRainMessage];
            $autoWateredDueToRain = true;
        } else {
            if ($isOutdoor && $todayRain !== null && $todayRain >= 2.0) {
                $quantity *= 0.8;
                $decisions[] = 'Réduction de 20% car pluie modérée attendue.';
            }

            $tomorrowRain = is_array($tomorrow) && isset($tomorrow['precipitation_sum'])
                ? (float) $tomorrow['precipitation_sum']
                : null;

            if ($isOutdoor && $tomorrowRain !== null && $tomorrowRain >= 7.0) {
                $nextDate = $nextDate->add(new \DateInterval('P1D'));
                $decisions[] = 'Report supplémentaire (+1 jour) car forte pluie attendue demain.';
            }

            $maxTemp = $today['temperature_max'] ?? null;
            if ($maxTemp !== null) {
                if ($maxTemp >= 32) {
                    $quantity *= 1.2;
                    $decisions[] = 'Augmentation de 20% car température max >= 32°C.';
                } elseif ($maxTemp <= 10) {
                    $quantity *= 0.9;
                    $decisions[] = 'Réduction de 10% car température max <= 10°C.';
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
}


