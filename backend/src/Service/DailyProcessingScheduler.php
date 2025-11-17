<?php

namespace App\Service;

use Psr\Log\LoggerInterface;

class DailyProcessingScheduler
{
    public function __construct(
        private readonly DailyPlantationsProcessor $processor,
        private readonly SystemStateService $systemStateService,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function runIfStale(): ?array
    {
        if (!$this->systemStateService->needsProcessRun()) {
            return null;
        }

        if (!$this->systemStateService->tryAcquireProcessLock()) {
            return null;
        }

        try {
            $result = $this->processor->run();
            $this->systemStateService->markProcessCompleted();
            return $result;
        } catch (\Throwable $exception) {
            $this->logger->error('Traitement fallback quotidien échoué', [
                'message' => $exception->getMessage(),
            ]);
            $this->systemStateService->releaseProcessLock();
            throw $exception;
        }
    }
}

