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

    public function hasUnreadNotification(UserPlantation $plantation, string $typeConseil): bool
    {
        $result = $this->createQueryBuilder('n')
            ->select('1')
            ->andWhere('n.userPlantation = :plantation')
            ->andWhere('n.typeConseil = :type')
            ->andWhere('n.statutLecture = false')
            ->setParameter('plantation', $plantation)
            ->setParameter('type', $typeConseil)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $result !== null;
    }

    public function countSince(\DateTimeImmutable $since): int
    {
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->andWhere('n.dateCreation >= :since')
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findLastNotificationDate(): ?\DateTimeImmutable
    {
        $result = $this->createQueryBuilder('n')
            ->select('n.dateCreation AS dateCreation')
            ->orderBy('n.dateCreation', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return isset($result['dateCreation']) && $result['dateCreation'] instanceof \DateTimeImmutable
            ? $result['dateCreation']
            : null;
    }
}