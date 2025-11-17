<?php

namespace App\Command;

use App\Service\DailyPlantationsProcessor;
use App\Service\SystemStateService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:plantations:process', description: 'Met à jour quotidiennement les suivis de plantations actives.')]
class ProcessPlantationsCommand extends Command
{
    public function __construct(
        private readonly DailyPlantationsProcessor $processor,
        private readonly SystemStateService $systemStateService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $result = $this->processor->run();
        $this->systemStateService->markProcessCompleted();

        $message = sprintf(
            '%d plantation(s) traitée(s), %d notification(s) générée(s).',
            $result['processed'],
            $result['notifications']
        );
        $io->success($message);

        return Command::SUCCESS;
    }
}


