<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour ajouter le champ date_plantation_confirmee à la table user_plantation
 */
final class Version20241114150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute le champ date_plantation_confirmee à la table user_plantation pour suivre la confirmation de plantation';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user_plantation ADD date_plantation_confirmee DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user_plantation DROP date_plantation_confirmee');
    }
}

