<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251117123000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création de la table system_state pour stocker les métadonnées globales.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE system_state (name VARCHAR(120) NOT NULL, payload JSON DEFAULT NULL, updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(name)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE system_state');
    }
}

