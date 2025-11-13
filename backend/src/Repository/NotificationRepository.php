<?php

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\UserPlantation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Notification>
 */
class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    public function hasRecentNotification(UserPlantation $plantation, string $typeConseil, \DateTimeImmutable $since): bool
    {
        $result = $this->createQueryBuilder('n')
            ->select('1')
            ->andWhere('n.userPlantation = :plantation')
            ->andWhere('n.typeConseil = :type')
            ->andWhere('n.dateCreation >= :since')
            ->setParameter('plantation', $plantation)
            ->setParameter('type', $typeConseil)
            ->setParameter('since', $since)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $result !== null;
    }
}