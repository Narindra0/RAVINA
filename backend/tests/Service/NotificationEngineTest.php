<?php

namespace App\Tests\Service;

use App\Entity\UserPlantation;
use App\Repository\NotificationRepository;
use App\Service\NotificationEngine;
use App\Service\WhatsAppNotifier;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;

class NotificationEngineTest extends TestCase
{
    public function testUpcomingReminderIsGenerated(): void
    {
        $repository = $this->createMock(NotificationRepository::class);
        $repository->method('hasRecentNotification')->willReturn(false);
        $repository->method('hasUnreadNotification')->willReturn(false);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->atLeastOnce())->method('persist');

        $notifier = $this->createMock(WhatsAppNotifier::class);
        $notifier->expects($this->never())->method('sendNotification');

        $engine = new NotificationEngine($repository, $entityManager, $notifier, new NullLogger());

        $plantation = (new UserPlantation())
            ->setDatePlantation(new \DateTimeImmutable('+2 days'));

        $created = $engine->evaluate($plantation, ['daily' => []]);

        $this->assertSame(1, $created);
    }

    public function testLatePlantingReminderIsGenerated(): void
    {
        $repository = $this->createMock(NotificationRepository::class);
        $repository->method('hasRecentNotification')->willReturn(false);
        $repository->method('hasUnreadNotification')->willReturn(false);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->atLeastOnce())->method('persist');

        $notifier = $this->createMock(WhatsAppNotifier::class);
        $notifier->expects($this->never())->method('sendNotification');

        $engine = new NotificationEngine($repository, $entityManager, $notifier, new NullLogger());

        $plantation = (new UserPlantation())
            ->setDatePlantation(new \DateTimeImmutable('-2 days'));

        $created = $engine->evaluate($plantation, ['daily' => []]);

        $this->assertSame(1, $created);
    }
}

