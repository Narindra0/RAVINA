<?php

namespace App\Service;

use App\Entity\SystemState;
use App\Repository\SystemStateRepository;
use Doctrine\ORM\EntityManagerInterface;

class SystemStateService
{
    private const KEY_DAILY_PROCESS = 'daily_process';

    public function __construct(
        private readonly SystemStateRepository $repository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function getLastProcessRunAt(): ?\DateTimeImmutable
    {
        $state = $this->repository->find(self::KEY_DAILY_PROCESS);
        $payload = $state?->getPayload() ?? [];
        $value = $payload['last_run_at'] ?? null;

        return $value ? new \DateTimeImmutable($value) : null;
    }

    public function needsProcessRun(): bool
    {
        $last = $this->getLastProcessRunAt();
        $today = new \DateTimeImmutable('today');

        return $last === null || $last < $today;
    }

    public function tryAcquireProcessLock(): bool
    {
        return $this->entityManager->wrapInTransaction(function (): bool {
            $state = $this->repository->getOrCreateForUpdate(self::KEY_DAILY_PROCESS);
            $payload = $state->getPayload() ?? [];

            $lastRun = $this->toDate($payload['last_run_at'] ?? null);
            $lockAt = $this->toDate($payload['lock_at'] ?? null);
            $now = new \DateTimeImmutable();
            $today = new \DateTimeImmutable('today');

            $needsRun = $lastRun === null || $lastRun < $today;
            if (!$needsRun) {
                return false;
            }

            if ($lockAt !== null && $lockAt > $now->sub(new \DateInterval('PT15M'))) {
                return false;
            }

            $payload['lock_at'] = $now->format(\DateTimeInterface::ATOM);
            $state->setPayload($payload);
            $this->entityManager->persist($state);
            $this->entityManager->flush();

            return true;
        });
    }

    public function releaseProcessLock(): void
    {
        $this->updatePayload(static function (array $payload): array {
            unset($payload['lock_at']);
            return $payload;
        });
    }

    public function markProcessCompleted(?\DateTimeImmutable $dateTime = null): void
    {
        $now = $dateTime ?? new \DateTimeImmutable();
        $this->updatePayload(static function (array $payload) use ($now): array {
            $payload['last_run_at'] = $now->format(\DateTimeInterface::ATOM);
            unset($payload['lock_at']);
            return $payload;
        });
    }

    private function updatePayload(callable $callback): void
    {
        $state = $this->repository->getOrCreate(self::KEY_DAILY_PROCESS);
        $payload = $state->getPayload() ?? [];
        $state->setPayload($callback($payload));
        $this->entityManager->persist($state);
        $this->entityManager->flush();
    }

    private function toDate(mixed $value): ?\DateTimeImmutable
    {
        if (!is_string($value) || $value === '') {
            return null;
        }

        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            return null;
        }
    }
}

