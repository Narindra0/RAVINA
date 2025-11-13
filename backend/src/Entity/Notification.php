<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\NotificationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: NotificationRepository::class)]
#[ORM\Table(name: 'notifications')]
#[ORM\Index(fields: ['statutLecture'], name: 'idx_notifications_statut_lecture')]
#[ORM\Index(fields: ['niveauPriorite'], name: 'idx_notifications_priorite')]
#[ApiResource(
    normalizationContext: ['groups' => ['notification:read']],
    denormalizationContext: ['groups' => ['notification:write']],
    operations: [
        new GetCollection(
            uriTemplate: '/notifications',
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
            normalizationContext: ['groups' => ['notification:read']]
        ),
        new Patch(
            uriTemplate: '/notifications/{id}',
            security: "object.getUserPlantation().getUser() == user",
            denormalizationContext: ['groups' => ['notification:write']]
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'statutLecture' => 'exact',
    'typeConseil' => 'exact',
])]
#[ApiFilter(OrderFilter::class, properties: ['dateCreation'], arguments: ['orderParameterName' => 'order'])]
class Notification
{
    public const PRIORITY_URGENT = 'URGENT';
    public const PRIORITY_IMPORTANT = 'IMPORTANT';
    public const PRIORITY_INFO = 'INFO';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['notification:read', 'user_plantation:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'notifications')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull]
    #[Groups(['notification:read', 'user_plantation:read'])]
    private ?UserPlantation $userPlantation = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Assert\NotNull]
    #[Groups(['notification:read', 'user_plantation:read'])]
    private ?\DateTimeImmutable $dateCreation = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 50)]
    #[Groups(['notification:read', 'notification:write', 'user_plantation:read'])]
    private ?string $typeConseil = null;

    #[ORM\Column(length: 10)]
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [self::class, 'getAllowedPriorities'])]
    #[Groups(['notification:read', 'notification:write', 'user_plantation:read'])]
    private ?string $niveauPriorite = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['notification:read', 'notification:write', 'user_plantation:read'])]
    private ?string $titre = null;

    #[ORM\Column(type: 'text')]
    #[Assert\NotBlank]
    #[Groups(['notification:read', 'notification:write', 'user_plantation:read'])]
    private ?string $messageDetaille = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['notification:read', 'notification:write', 'user_plantation:read'])]
    private bool $statutLecture = false;

    public function __construct()
    {
        $this->dateCreation = new \DateTimeImmutable();
        $this->niveauPriorite = self::PRIORITY_INFO;
    }

    public static function getAllowedPriorities(): array
    {
        return [
            self::PRIORITY_URGENT,
            self::PRIORITY_IMPORTANT,
            self::PRIORITY_INFO,
        ];
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserPlantation(): ?UserPlantation
    {
        return $this->userPlantation;
    }

    public function setUserPlantation(?UserPlantation $userPlantation): self
    {
        $this->userPlantation = $userPlantation;
        return $this;
    }

    public function getDateCreation(): ?\DateTimeImmutable
    {
        return $this->dateCreation;
    }

    public function setDateCreation(\DateTimeImmutable $dateCreation): self
    {
        $this->dateCreation = $dateCreation;
        return $this;
    }

    public function getTypeConseil(): ?string
    {
        return $this->typeConseil;
    }

    public function setTypeConseil(string $typeConseil): self
    {
        $this->typeConseil = $typeConseil;
        return $this;
    }

    public function getNiveauPriorite(): ?string
    {
        return $this->niveauPriorite;
    }

    public function setNiveauPriorite(string $niveauPriorite): self
    {
        $priority = strtoupper($niveauPriorite);
        if (!in_array($priority, self::getAllowedPriorities(), true)) {
            throw new \InvalidArgumentException(sprintf('Priorité "%s" invalide pour Notification.', $niveauPriorite));
        }
        $this->niveauPriorite = $priority;
        return $this;
    }

    public function getTitre(): ?string
    {
        return $this->titre;
    }

    public function setTitre(string $titre): self
    {
        $this->titre = $titre;
        return $this;
    }

    public function getMessageDetaille(): ?string
    {
        return $this->messageDetaille;
    }

    public function setMessageDetaille(string $messageDetaille): self
    {
        $this->messageDetaille = $messageDetaille;
        return $this;
    }

    public function isStatutLecture(): bool
    {
        return $this->statutLecture;
    }

    public function setStatutLecture(bool $statutLecture): self
    {
        $this->statutLecture = $statutLecture;
        return $this;
    }
}



