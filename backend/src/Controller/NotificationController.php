<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\WhatsAppNotifier;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class NotificationController extends AbstractController
{
    #[Route('/api/notifications/whatsapp', name: 'api_notifications_whatsapp_send', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function sendWhatsAppNotification(
        Request $request,
        WhatsAppNotifier $whatsAppNotifier,
        UserRepository $userRepository,
        UserInterface $currentUser,
    ): JsonResponse {
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur invalide.'], Response::HTTP_FORBIDDEN);
        }

        $payload = json_decode($request->getContent() ?: '{}', true);
        if (!is_array($payload)) {
            return $this->json(['error' => 'Payload JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $title = trim((string) ($payload['title'] ?? ''));
        $message = trim((string) ($payload['message'] ?? ''));

        if ($title === '' || $message === '') {
            return $this->json(['error' => 'Les champs "title" et "message" sont requis.'], Response::HTTP_BAD_REQUEST);
        }

        $targetUser = $this->resolveTargetUser($payload['userId'] ?? null, $currentUser, $userRepository);
        if ($targetUser === null) {
            return $this->json(['error' => 'Utilisateur cible introuvable ou accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $phone = $targetUser->getNumeroTelephone();
        if (!$phone) {
            return $this->json(['error' => 'Aucun numéro WhatsApp configuré pour cet utilisateur.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $sent = $whatsAppNotifier->sendNotification($phone, $title, $message);
        if (!$sent) {
            return $this->json(['error' => 'Échec de l’envoi via WhatsApp Cloud API.'], Response::HTTP_BAD_GATEWAY);
        }

        return $this->json([
            'status' => 'sent',
            'to' => $phone,
        ]);
    }

    private function resolveTargetUser(mixed $userId, User $currentUser, UserRepository $repository): ?User
    {
        if ($userId === null || $userId === $currentUser->getId()) {
            return $currentUser;
        }

        $targetId = filter_var($userId, FILTER_VALIDATE_INT);
        if ($targetId === false) {
            return null;
        }

        if ($currentUser->getId() !== $targetId && !in_array('ROLE_ADMIN', $currentUser->getRoles(), true)) {
            return null;
        }

        return $repository->find($targetId);
    }
}

