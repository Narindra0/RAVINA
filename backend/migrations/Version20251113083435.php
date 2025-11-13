<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251113083435 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création de la table notifications pour stocker les conseils envoyés aux utilisateurs.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE notifications (
                id INT AUTO_INCREMENT NOT NULL,
                user_plantation_id INT NOT NULL,
                date_creation DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
                type_conseil VARCHAR(50) NOT NULL,
                niveau_priorite VARCHAR(10) NOT NULL,
                titre VARCHAR(255) NOT NULL,
                message_detaille LONGTEXT NOT NULL,
                statut_lecture TINYINT(1) NOT NULL,
                INDEX IDX_6000B0D3F76B2F3C (user_plantation_id),
                INDEX idx_notifications_statut_lecture (statut_lecture),
                INDEX idx_notifications_priorite (niveau_priorite),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql('ALTER TABLE notifications ADD CONSTRAINT FK_6000B0D3F76B2F3C FOREIGN KEY (user_plantation_id) REFERENCES user_plantation (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notifications DROP FOREIGN KEY FK_6000B0D3F76B2F3C');
        $this->addSql('DROP TABLE notifications');
    }
}
