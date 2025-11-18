<?php

namespace App\Repository;

use App\Entity\SuiviSnapshot;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SuiviSnapshot>
 */
class SuiviSnapshotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SuiviSnapshot::class);
    }

    public function countOlderThan(\DateTimeImmutable $threshold): int
    {
        return (int) $this->createQueryBuilder('s')
            ->select('COUNT(s.id)')
            ->where('s.dateSnapshot < :threshold')
            ->setParameter('threshold', $threshold)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function deleteOlderThan(\DateTimeImmutable $threshold): int
    {
        return $this->createQueryBuilder('s')
            ->delete()
            ->where('s.dateSnapshot < :threshold')
            ->setParameter('threshold', $threshold)
            ->getQuery()
            ->execute();
    }
}


