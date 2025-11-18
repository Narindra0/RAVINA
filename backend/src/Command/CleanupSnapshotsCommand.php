<?php

namespace App\Command;

use App\Repository\SuiviSnapshotRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:snapshots:cleanup',
    description: 'Supprime les snapshots de suivi plus anciens que la rétention configurée.'
)]
class CleanupSnapshotsCommand extends Command
{
    public function __construct(
        private readonly SuiviSnapshotRepository $snapshotRepository,
        private readonly int $retentionMonths
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption(
                'dry-run',
                null,
                InputOption::VALUE_NONE,
                'Affiche le nombre de snapshots concernés sans les supprimer.'
            )
            ->addOption(
                'older-than',
                null,
                InputOption::VALUE_REQUIRED,
                'Nombre de mois de rétention à appliquer pour cette exécution.'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $retentionMonths = $this->resolveRetentionMonths($input->getOption('older-than'));
        $cutoff = (new \DateTimeImmutable('today'))->sub(new \DateInterval(sprintf('P%dM', $retentionMonths)));

        $count = $this->snapshotRepository->countOlderThan($cutoff);
        if ($count === 0) {
            $io->success('Aucun snapshot ancien à nettoyer.');
            return Command::SUCCESS;
        }

        if ($input->getOption('dry-run')) {
            $io->warning(sprintf(
                '%d snapshot%s plus anciens que le %s seraient supprimés (mode simulation).',
                $count,
                $count > 1 ? 's' : '',
                $cutoff->format('Y-m-d')
            ));

            return Command::SUCCESS;
        }

        $deleted = $this->snapshotRepository->deleteOlderThan($cutoff);
        $io->success(sprintf(
            '%d snapshot%s supprimé%s (rétention %d mois).',
            $deleted,
            $deleted > 1 ? 's' : '',
            $deleted > 1 ? 's' : '',
            $retentionMonths
        ));

        return Command::SUCCESS;
    }

    private function resolveRetentionMonths(mixed $override): int
    {
        if ($override === null) {
            return max(1, $this->retentionMonths);
        }

        $value = (int) $override;
        return max(1, $value);
    }
}

