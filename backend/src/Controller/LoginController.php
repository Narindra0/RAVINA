<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;

class LoginController extends AbstractController
{
    #[Route('/api/login', name: 'api_login_manual', methods: ['POST'])]
    public function index(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $JWTManager
    ): JsonResponse {
        
        // 1. Décode le corps JSON
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
             throw new BadCredentialsException('Email et mot de passe requis dans le corps de la requête.');
        }

        // 2. Recherche l'utilisateur par email
        $user = $userRepository->findOneBy(['email' => $email]);

        // 3. Vérifie l'utilisateur et le mot de passe
        if (!$user || !$passwordHasher->isPasswordValid($user, $password)) {
             // 401 Unauthorized sera renvoyé (via BadCredentialsException)
             throw new BadCredentialsException('Identifiants invalides.');
        }

        // 4. Authentification réussie : Génère le jeton JWT
        return new JsonResponse([
            'token' => $JWTManager->create($user),
        ]);
    }
}