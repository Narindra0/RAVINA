<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251114120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout des colonnes nécessaires à la vérification des numéros de téléphone.';
    }

    public function up(Schema $schema): void
    {
        $table = $schema->getTable('user');
        if (!$table->hasColumn('phone_verification_code')) {
            $table->addColumn('phone_verification_code', 'string', [
                'length' => 6,
                'notnull' => false,
            ]);
        }

        if (!$table->hasColumn('phone_verification_expires_at')) {
            $table->addColumn('phone_verification_expires_at', 'datetime_immutable', [
                'notnull' => false,
            ]);
        }

        if (!$table->hasColumn('phone_verified_at')) {
            $table->addColumn('phone_verified_at', 'datetime_immutable', [
                'notnull' => false,
            ]);
        }
    }

    public function down(Schema $schema): void
    {
        $table = $schema->getTable('user');
        if ($table->hasColumn('phone_verification_code')) {
            $table->dropColumn('phone_verification_code');
        }

        if ($table->hasColumn('phone_verification_expires_at')) {
            $table->dropColumn('phone_verification_expires_at');
        }

        if ($table->hasColumn('phone_verified_at')) {
            $table->dropColumn('phone_verified_at');
        }
    }
}

