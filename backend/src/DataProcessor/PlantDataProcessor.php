<?php
namespace App\DataProcessor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Plant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;

final class PlantDataProcessor implements ProcessorInterface
{
    private EntityManagerInterface $entityManager;
    private SluggerInterface $slugger;
    private string $uploadPath;

    public function __construct(
        EntityManagerInterface $entityManager,
        SluggerInterface $slugger,
        string $kernelProjectDir // Chemin de la racine de votre projet Symfony (backend)
    ) {
        $this->entityManager = $entityManager;
        $this->slugger = $slugger;
        
        // 🚀 MISE À JOUR DU CHEMIN D'UPLOAD 🚀
        // Le chemin pointe maintenant vers le répertoire public du frontend
        $this->uploadPath = $kernelProjectDir . '/../frontend/public/images/plantes';
    }

    /**
     * @param Plant $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Plant
    {
        if (!$data instanceof Plant) {
            throw new \RuntimeException("Unexpected data type.");
        }
        
        if ($data->getImageFile() instanceof UploadedFile) {
            /** @var UploadedFile $file */
            $file = $data->getImageFile();
            
            // 1. Nettoyer le nom de la plante (ex: "Tomate Cerise" -> "tomate-cerise")
            $safeFilename = $this->slugger->slug($data->getName())->lower();
            
            // 2. Créer le nom de fichier final (ex: tomate-cerise.jpg)
            $newFilename = sprintf('%s.%s', $safeFilename, $file->guessExtension() ?? 'jpg');

            // 3. Déplacer le fichier vers le dossier du frontend
            $file->move(
                $this->uploadPath,
                $newFilename
            );
            
            // 4. ENREGISTRER le nom dans la colonne imageSlug (chemin relatif public)
            $data->setImageSlug($newFilename);
            
            // 5. Nettoyer la propriété ImageFile
            $data->setImageFile(null); 
        }

        // 6. Persister et enregistrer en base de données
        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }

    public function supports(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): bool
    {
        return $data instanceof Plant && $operation->getMethod() === 'POST';
    }
}