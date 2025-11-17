<?php

namespace App\Tests\Service;

use App\Entity\PlantTemplate;
use App\Entity\UserPlantation;
use App\Service\LifecycleService;
use PHPUnit\Framework\TestCase;

class LifecycleServiceTest extends TestCase
{
    public function testProgressionBloqueeAvantConfirmation(): void
    {
        $template = (new PlantTemplate())
            ->setExpectedHarvestDays(60)
            ->setName('Basilic')
            ->setType('Aromatique');

        $plantation = (new UserPlantation())
            ->setPlantTemplate($template)
            ->setDatePlantation(new \DateTimeImmutable('-5 days'));

        $service = new LifecycleService();
        $result = $service->compute($plantation);

        $this->assertSame(0.0, $result['progression']);
        $this->assertSame('En attente de plantation', $result['stage']);
        $this->assertSame('pending_confirmation', $result['details']['stage_source']);
    }

    public function testProgressionUtiliseDateConfirmee(): void
    {
        $template = (new PlantTemplate())
            ->setExpectedHarvestDays(60)
            ->setName('Tomate')
            ->setType('Légume');

        $plantation = (new UserPlantation())
            ->setPlantTemplate($template)
            ->setDatePlantation(new \DateTimeImmutable('-30 days'))
            ->setDatePlantationConfirmee(new \DateTimeImmutable('-10 days'));

        $service = new LifecycleService();
        $result = $service->compute($plantation);

        $this->assertGreaterThan(0, $result['progression']);
        $this->assertSame('default', $result['details']['stage_source']);
    }
}

