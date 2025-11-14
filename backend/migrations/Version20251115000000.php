<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251115000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la colonne user_id dans notifications et rend user_plantation_id nullable pour permettre les notifications générales.';
    }

    public function up(Schema $schema): void
    {
        $table = $schema->getTable('notifications');
        
        // Rendre user_plantation_id nullable
        $column = $table->getColumn('user_plantation_id');
        if ($column->getNotnull()) {
            $column->setNotnull(false);
        }

        // Ajouter la colonne user_id si elle n'existe pas
        if (!$table->hasColumn('user_id')) {
            $table->addColumn('user_id', 'integer', [
                'notnull' => false,
            ]);
            $table->addForeignKeyConstraint(
                'user',
                ['user_id'],
                ['id'],
                ['onDelete' => 'CASCADE']
            );
        }
    }

    public function down(Schema $schema): void
    {
        $table = $schema->getTable('notifications');
        
        // Supprimer la colonne user_id si elle existe
        if ($table->hasColumn('user_id')) {
            $table->dropColumn('user_id');
        }

        // Remettre user_plantation_id en non-nullable (attention: peut échouer si des données existent)
        $column = $table->getColumn('user_plantation_id');
        if (!$column->getNotnull()) {
            $column->setNotnull(true);
        }
    }
}

