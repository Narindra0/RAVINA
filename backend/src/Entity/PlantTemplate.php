<?php

namespace App\Entity;

use App\Repository\PlantTemplateRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;

#[ORM\Entity(repositoryClass: PlantTemplateRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Table(name: 'plant_template')]
#[ApiResource(
    normalizationContext: ['groups' => ['plant_template:read']],
    denormalizationContext: ['groups' => ['plant_template:write']],
    operations: [
        new Get(security: "object.getUser() == user"),
        new GetCollection(security: "is_granted('IS_AUTHENTICATED_FULLY')"),
        new Post(security: "is_granted('IS_AUTHENTICATED_FULLY')"),
        new Put(security: "object.getUser() == user"),
        new Delete(security: "object.getUser() == user"),
    ]
)]
class PlantTemplate
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['plant:read', 'plant_template:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['plant:read'])]
    private ?User $user = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?string $name = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?string $type = null;

    #[ORM\Column]
    #[Assert\Positive]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?int $expectedHarvestDays = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?string $location = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?string $notes = null;

    #[ORM\Column]
    #[Groups(['plant_template:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?string $bestSeason = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?string $wateringFrequency = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?string $sunExposure = null;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?array $cyclePhasesJson = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?int $wateringQuantityMl = null;

    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['plant_template:read', 'plant_template:write'])]
    private ?string $imageSlug = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): self { $this->user = $user; return $this; }

    public function getName(): ?string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }

    public function getType(): ?string { return $this->type; }
    public function setType(string $type): self { $this->type = $type; return $this; }

    public function getExpectedHarvestDays(): ?int { return $this->expectedHarvestDays; }
    public function setExpectedHarvestDays(int $days): self { $this->expectedHarvestDays = $days; return $this; }

    public function getLocation(): ?string { return $this->location; }
    public function setLocation(?string $loc): self { $this->location = $loc; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): self { $this->notes = $notes; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }

    public function getBestSeason(): ?string { return $this->bestSeason; }
    public function setBestSeason(?string $v): self { $this->bestSeason = $v; return $this; }

    public function getWateringFrequency(): ?string { return $this->wateringFrequency; }
    public function setWateringFrequency(?string $v): self { $this->wateringFrequency = $v; return $this; }

    public function getSunExposure(): ?string { return $this->sunExposure; }
    public function setSunExposure(?string $v): self { $this->sunExposure = $v; return $this; }

    public function getCyclePhasesJson(): ?array { return $this->cyclePhasesJson; }
    public function setCyclePhasesJson(?array $v): self { $this->cyclePhasesJson = $v; return $this; }

    public function getWateringQuantityMl(): ?int { return $this->wateringQuantityMl; }
    public function setWateringQuantityMl(?int $v): self { $this->wateringQuantityMl = $v; return $this; }

    public function getImageSlug(): ?string { return $this->imageSlug; }
    public function setImageSlug(?string $v): self { $this->imageSlug = $v; return $this; }
}


