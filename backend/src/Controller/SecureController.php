<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class SecureController extends AbstractController
{
    #[Route('/api/secure', name: 'api_secure')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Accès autorisé 🎯',
            'user' => $this->getUser()->getUserIdentifier(),
        ]);
    }
}
