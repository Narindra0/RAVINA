<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\RedirectionExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ServerExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class WhatsAppNotifier
{
    private const PRODUCT = 'whatsapp';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
        private readonly ?string $accessToken,
        private readonly ?string $phoneNumberId,
        private readonly string $apiBaseUrl,
        private readonly string $apiVersion,
        private readonly ?string $templateName,
        private readonly string $templateLanguage,
        private readonly bool $enabled,
    ) {
    }

    public function sendNotification(?string $rawPhoneNumber, string $title, string $message): bool
    {
        $recipient = $this->formatPhoneNumber($rawPhoneNumber);
        if (!$recipient) {
            $this->logger->debug('Envoi WhatsApp ignoré: numéro destinataire manquant ou invalide.');
            return false;
        }

        if (!$this->isConfigured()) {
            $this->logger->debug('Envoi WhatsApp ignoré: configuration incomplète.');
            return false;
        }

        $payload = $this->buildPayload($recipient, $title, $message);
        $url = sprintf(
            '%s/%s/%s/messages',
            rtrim($this->apiBaseUrl, '/'),
            trim($this->apiVersion, '/'),
            $this->phoneNumberId
        );

        try {
            $response = $this->httpClient->request('POST', $url, [
                'headers' => [
                    'Authorization' => sprintf('Bearer %s', $this->accessToken),
                    'Content-Type' => 'application/json',
                ],
                'json' => $payload,
            ]);

            if ($response->getStatusCode() >= Response::HTTP_OK && $response->getStatusCode() < Response::HTTP_MULTIPLE_CHOICES) {
                return true;
            }

            $this->logger->warning('Réponse inattendue de WhatsApp Cloud API', [
                'status' => $response->getStatusCode(),
                'body' => $response->getContent(false),
            ]);
        } catch (ClientExceptionInterface|RedirectionExceptionInterface|ServerExceptionInterface|TransportExceptionInterface $exception) {
            $this->logger->error('Erreur lors de l’envoi de la notification WhatsApp', [
                'message' => $exception->getMessage(),
            ]);
        }

        return false;
    }

    private function isConfigured(): bool
    {
        if ($this->enabled === false) {
            return false;
        }

        return !empty($this->accessToken) && !empty($this->phoneNumberId);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(string $recipient, string $title, string $message): array
    {
        if ($this->templateName) {
            return [
                'messaging_product' => self::PRODUCT,
                'to' => $recipient,
                'type' => 'template',
                'template' => [
                    'name' => $this->templateName,
                    'language' => ['code' => $this->templateLanguage ?: 'fr'],
                    'components' => [
                        [
                            'type' => 'body',
                            'parameters' => [
                                ['type' => 'text', 'text' => $title],
                                ['type' => 'text', 'text' => $message],
                            ],
                        ],
                    ],
                ],
            ];
        }

        return [
            'messaging_product' => self::PRODUCT,
            'to' => $recipient,
            'type' => 'text',
            'text' => [
                'preview_url' => false,
                'body' => sprintf("%s\n\n%s", $title, $message),
            ],
        ];
    }

    private function formatPhoneNumber(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $normalized = preg_replace('/[\s\-\.]/', '', trim($value));
        if (!$normalized) {
            return null;
        }

        if (str_starts_with($normalized, '00')) {
            $normalized = '+' . substr($normalized, 2);
        }

        if (!str_starts_with($normalized, '+')) {
            $normalized = '+' . $normalized;
        }

        return $normalized;
    }
}

