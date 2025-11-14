<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class UserController extends AbstractController
{
    /**
     * Récupère les informations de l'utilisateur connecté.
     * Nécessite une authentification complète (token JWT valide).
     */
    #[Route('/api/user', name: 'api_user', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getUserInfo(User $user): JsonResponse
    {
        return $this->json([
            'email' => $user->getUserIdentifier(),
            'numeroTelephone' => $user->getNumeroTelephone(),
            'phoneVerified' => $user->isPhoneVerified(),
            'phoneVerificationRequired' => !$user->isPhoneVerified(),
        ]);
    }
}