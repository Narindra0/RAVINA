<?php

namespace App\Controller;

use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class WebhookController extends AbstractController
{
    #[Route('/webhook/whatsapp', name: 'webhook_whatsapp', methods: ['GET', 'POST'])]
    public function handleWhatsAppWebhook(
        Request $request,
        LoggerInterface $logger,
        #[Autowire('%env(string:WHATSAPP_VERIFY_TOKEN)%')] string $verifyToken,
    ): Response {
        if ($request->isMethod('GET')) {
            $mode = $request->query->get('hub_mode');
            $token = $request->query->get('hub_verify_token');
            $challenge = $request->query->get('hub_challenge');

            if ($mode === 'subscribe' && $token !== null && hash_equals((string) $verifyToken, (string) $token)) {
                return new Response((string) $challenge, Response::HTTP_OK, ['Content-Type' => 'text/plain']);
            }

            return new Response('Invalid verify token', Response::HTTP_FORBIDDEN);
        }

        $payload = json_decode($request->getContent() ?: '{}', true);
        if (!is_array($payload)) {
            $payload = ['raw' => $request->getContent()];
        }

        $logger->info('Webhook WhatsApp reçu', ['payload' => $payload]);

        return new JsonResponse(['status' => 'received']);
    }
}

