<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\WhatsAppNotifier;
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
    private const CODE_TTL_MINUTES = 10;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly WhatsAppNotifier $whatsAppNotifier,
    ) {
    }

    #[Route('/api/phone/send-code', name: 'api_phone_send_code', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function sendCode(Request $request): JsonResponse
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

        $verificationCode = (string) random_int(100000, 999999);
        $expiresAt = new \DateTimeImmutable(sprintf('+%d minutes', self::CODE_TTL_MINUTES));

        $user->setNumeroTelephone($normalized);
        $user->setPhoneVerificationCode($verificationCode);
        $user->setPhoneVerificationExpiresAt($expiresAt);
        $user->setPhoneVerifiedAt(null);

        $this->entityManager->flush();

        $title = 'Code de vérification Ravina';
        $message = sprintf(
            'Votre code de vérification Ravina est %s. Il expirera dans %d minutes.',
            $verificationCode,
            self::CODE_TTL_MINUTES
        );

        $sent = $this->whatsAppNotifier->sendNotification($normalized, $title, $message);

        if (!$sent) {
            return $this->json([
                'error' => 'Impossible d’envoyer le code WhatsApp pour le moment. Veuillez réessayer.',
            ], Response::HTTP_BAD_GATEWAY);
        }

        return $this->json([
            'status' => 'code_sent',
            'numeroTelephone' => $normalized,
            'expiresAt' => $expiresAt->format(DATE_ATOM),
        ]);
    }

    #[Route('/api/phone/confirm-code', name: 'api_phone_confirm_code', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function confirmCode(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Authentification requise.'], Response::HTTP_UNAUTHORIZED);
        }

        $payload = json_decode($request->getContent(), true) ?? [];
        $code = isset($payload['code']) ? trim((string) $payload['code']) : null;

        if (!$code || strlen($code) !== 6 || !ctype_digit($code)) {
            return $this->json(['error' => 'Le code doit contenir exactement 6 chiffres.'], Response::HTTP_BAD_REQUEST);
        }

        $expectedCode = $user->getPhoneVerificationCode();
        $expiresAt = $user->getPhoneVerificationExpiresAt();

        if (!$expectedCode || !$expiresAt) {
            return $this->json([
                'error' => 'Aucun code n’est actif. Merci de recommencer l’envoi.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($expiresAt < new \DateTimeImmutable()) {
            return $this->json([
                'error' => 'Ce code a expiré. Merci de demander un nouveau code.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!hash_equals($expectedCode, $code)) {
            return $this->json([
                'error' => 'Le code saisi est incorrect.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->setPhoneVerificationCode(null);
        $user->setPhoneVerificationExpiresAt(null);
        $user->setPhoneVerifiedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        return $this->json([
            'status' => 'phone_verified',
            'numeroTelephone' => $user->getNumeroTelephone(),
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

