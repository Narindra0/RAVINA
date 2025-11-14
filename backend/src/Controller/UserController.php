<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Security\Core\User\UserInterface;

class UserController extends AbstractController
{
    /**
     * Récupère les informations de l'utilisateur connecté.
     * Nécessite une authentification complète (token JWT valide).
     */
    #[Route('/api/user', name: 'api_user', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getUserInfo(UserInterface $user): JsonResponse
    {
        return $this->json([
            'email' => $user->getUserIdentifier(),
            'numeroTelephone' => method_exists($user, 'getNumeroTelephone') ? $user->getNumeroTelephone() : null,
            'phoneVerified' => method_exists($user, 'isPhoneVerified') ? $user->isPhoneVerified() : false,
            'phoneVerificationRequired' => method_exists($user, 'isPhoneVerified') ? !$user->isPhoneVerified() : true,
        ]);
    }
}