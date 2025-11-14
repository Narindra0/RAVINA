<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class PhoneVerificationController extends AbstractController
{
    private const COUNTRY_PREFIX = '+261';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/phone/save', name: 'api_phone_save', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function savePhoneNumber(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Authentification requise.'], Response::HTTP_UNAUTHORIZED);
        }

        $payload = json_decode($request->getContent(), true) ?? [];
        $normalized = $this->normalizePhoneNumber($payload['phoneSuffix'] ?? $payload['numeroTelephone'] ?? null);

        if (!$normalized) {
            return $this->json([
                'error' => 'Merci de saisir un numéro malgache valide (9 chiffres après +261).',
            ], Response::HTTP_BAD_REQUEST);
        }

        $user->setNumeroTelephone($normalized);
        $this->entityManager->flush();

        return $this->json([
            'status' => 'phone_saved',
            'numeroTelephone' => $normalized,
            'phoneVerified' => true,
        ]);
    }

    private function normalizePhoneNumber(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $value);
        if (!$digits) {
            return null;
        }

        if (str_starts_with($digits, '261')) {
            $digits = substr($digits, 3);
        }

        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            $digits = substr($digits, 1);
        }

        if (strlen($digits) !== 9) {
            return null;
        }

        return self::COUNTRY_PREFIX . $digits;
    }
}

