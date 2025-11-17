<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251117120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout du champ last_manual_watering_at sur user_plantation';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user_plantation ADD last_manual_watering_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user_plantation DROP last_manual_watering_at');
    }
}

