<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\ApiProperty;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Serializer\Annotation\Groups;
use App\Repository\PlantRepository;
use App\ApiResource\SuggestionsOutput; // <-- Import unique et correct
use App\State\PlantSuggestionsProvider; // <-- Import unique et correct

#[ORM\Entity(repositoryClass: PlantRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    normalizationContext: ['groups' => ['plant:read']],
    denormalizationContext: ['groups' => ['plant:write']],
    operations: [
        // Opérations CRUD standards
        new Get(security: "object.getUser() == user"),
        new GetCollection(security: "is_granted('IS_AUTHENTICATED_FULLY')"),
        new Post(security: "is_granted('IS_AUTHENTICATED_FULLY')"),
        new Put(security: "object.getUser() == user"),
        new Delete(security: "object.getUser() == user"),
        
        // NOUVELLE OPÉRATION : Suggestions
        new Get(
            uriTemplate: '/plants/suggestions',
            name: 'suggestions',
            output: SuggestionsOutput::class, // Utilisation de ::class pour le DTO
            read: false,
            provider: PlantSuggestionsProvider::class, // Utilisation de ::class pour le Provider
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
        ),
    ]
)]
class Plant
{
    // ... Les propriétés sont inchangées ...
    
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['plant:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'plants')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['plant:read'])]
    private ?User $user = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Groups(['plant:read', 'plant:write'])]
    private ?string $name = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Groups(['plant:read', 'plant:write'])]
    private ?string $type = null;

    #[ORM\Column(type: 'datetime')]
    #[Assert\NotNull]
    #[Assert\LessThanOrEqual('today')]
    #[Groups(['plant:read', 'plant:write'])]
    private ?\DateTimeInterface $plantedAt = null;

    #[ORM\Column]
    #[Assert\Positive]
    #[Groups(['plant:read', 'plant:write'])]
    private ?int $expectedHarvestDays = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['plant:read', 'plant:write'])]
    private ?string $location = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['plant:read', 'plant:write'])]
    private ?string $notes = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['plant:read', 'plant:write'])]
    private ?string $bestSeason = null; // Nouveau champ

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['plant:read', 'plant:write'])]
    private ?string $wateringFrequency = null; // Nouveau champ

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['plant:read', 'plant:write'])]
    private ?string $sunExposure = null; // Nouveau champ

    #[ORM\Column]
    #[Groups(['plant:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['plant:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // Getters / Setters ↓
    public function getId(): ?int { return $this->id; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): self { $this->user = $user; return $this; }

    public function getName(): ?string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }

    public function getType(): ?string { return $this->type; }
    public function setType(string $type): self { $this->type = $type; return $this; }

    public function getPlantedAt(): ?\DateTimeInterface { return $this->plantedAt; }
    public function setPlantedAt(\DateTimeInterface $date): self { $this->plantedAt = $date; return $this; }

    public function getExpectedHarvestDays(): ?int { return $this->expectedHarvestDays; }
    
    // 🚨 CORRECTION DU BUG DE SYNTAXE (Ligne 136)
    // Le '$' devant 'this' manquait dans la ligne de code originale.
    public function setExpectedHarvestDays(int $days): self 
    { 
        $this->expectedHarvestDays = $days; // Correction ici
        return $this; 
    }

    public function getLocation(): ?string { return $this->location; }
    public function setLocation(?string $loc): self { $this->location = $loc; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): self { $this->notes = $notes; return $this; }

    // Nouveaux Getters / Setters ↓

    public function getBestSeason(): ?string
    {
        return $this->bestSeason;
    }

    public function setBestSeason(?string $bestSeason): self
    {
        $this->bestSeason = $bestSeason;
        return $this;
    }

    public function getWateringFrequency(): ?string
    {
        return $this->wateringFrequency;
    }

    public function setWateringFrequency(?string $wateringFrequency): self
    {
        $this->wateringFrequency = $wateringFrequency;
        return $this;
    }

    public function getSunExposure(): ?string
    {
        return $this->sunExposure;
    }

    public function setSunExposure(?string $sunExposure): self
    {
        $this->sunExposure = $sunExposure;
        return $this;
    }
    
    // Fin Nouveaux Getters / Setters

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }

    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
}