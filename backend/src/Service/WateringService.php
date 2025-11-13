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

        $referenceDate = $lastSnapshot?->getArrosageRecoDate()
            ?? $plantation->getDatePlantation()
            ?? new \DateTimeImmutable('today');

        $referenceDate = $this->toImmutable($referenceDate);

        $nextDate = $referenceDate->add(new \DateInterval(sprintf('P%dD', $frequencyDays)));
        $quantity = $baseQuantity;
        $decisions = [];

        $today = $meteoData['daily'][0] ?? null;
        $tomorrow = $meteoData['daily'][1] ?? null;

        if (is_array($today) && isset($today['precipitation_sum']) && $today['precipitation_sum'] !== null) {
            if ($today['precipitation_sum'] >= 5) {
                $nextDate = $nextDate->add(new \DateInterval('P1D'));
                $decisions[] = 'Report d\'arrosage (+1 jour) car pluie >= 5mm prévue aujourd\'hui.';
            } elseif ($today['precipitation_sum'] >= 2) {
                $quantity *= 0.8;
                $decisions[] = 'Réduction de 20% car pluie modérée attendue.';
            }
        }

        if (is_array($tomorrow) && isset($tomorrow['precipitation_sum']) && $tomorrow['precipitation_sum'] >= 7) {
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

        $quantity = round($quantity, 2);

        return [
            'date' => $nextDate,
            'quantity' => $quantity,
            'notes' => $decisions,
            'frequency_days' => $frequencyDays,
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
}


