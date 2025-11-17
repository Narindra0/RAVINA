<?php

namespace App\Repository;

use App\Entity\SystemState;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SystemState>
 */
class SystemStateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SystemState::class);
    }

    public function getOrCreate(string $name): SystemState
    {
        $state = $this->find($name);
        if ($state instanceof SystemState) {
            return $state;
        }

        $state = (new SystemState())->setName($name);
        $this->_em->persist($state);
        $this->_em->flush();

        return $state;
    }

    public function getOrCreateForUpdate(string $name): SystemState
    {
        $state = $this->createQueryBuilder('s')
            ->andWhere('s.name = :name')
            ->setParameter('name', $name)
            ->getQuery()
            ->setLockMode(LockMode::PESSIMISTIC_WRITE)
            ->getOneOrNullResult();

        if ($state instanceof SystemState) {
            return $state;
        }

        $state = (new SystemState())->setName($name);
        $this->_em->persist($state);
        $this->_em->flush();
        $this->_em->lock($state, LockMode::PESSIMISTIC_WRITE);

        return $state;
    }
}

