<?php

namespace App\Command;

use App\Repository\NotificationRepository;
use App\Service\WhatsAppNotifier;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:notifications:diagnose', description: 'Vérifie la santé du moteur de notifications.')]
class NotificationsDiagnosticsCommand extends Command
{
    public function __construct(
        private readonly NotificationRepository $notificationRepository,
        private readonly WhatsAppNotifier $whatsAppNotifier,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $since = new \DateTimeImmutable('-1 day');
        $count = $this->notificationRepository->countSince($since);
        $last = $this->notificationRepository->findLastNotificationDate();

        $io->section('Notifications persistées');
        $io->text(sprintf('Notifications créées sur les 24 dernières heures : %d', $count));
        $io->text(sprintf(
            'Dernière notification : %s',
            $last ? $last->format(\DateTimeInterface::ATOM) : 'aucune'
        ));

        $io->section('Intégration WhatsApp');
        if ($this->whatsAppNotifier->isReady()) {
            $io->success('WhatsApp notifier correctement configuré (token et phone number ID présents).');
        } else {
            $io->warning('WhatsApp notifier désactivé ou mal configuré. Vérifiez l’access token et le phone number ID.');
        }

        return Command::SUCCESS;
    }
}

