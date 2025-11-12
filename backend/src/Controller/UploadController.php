<?php

namespace App\Controller;

use Cloudinary\Cloudinary;
use Cloudinary\Api\Exception\ApiError;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class UploadController extends AbstractController
{
    #[Route('/api/upload/plant-template-image', name: 'upload_plant_template_image', methods: ['POST'])]
    public function uploadPlantTemplateImage(Request $request): Response
    {
        $file = $request->files->get('file');
        $rawName = (string) $request->request->get('name', '');

        if (!$file) {
            return new JsonResponse(['error' => 'File is required'], Response::HTTP_BAD_REQUEST);
        }

        $cloudName = $_ENV['CLOUDINARY_CLOUD_NAME'] ?? null;
        $apiKey = $_ENV['CLOUDINARY_API_KEY'] ?? null;
        $apiSecret = $_ENV['CLOUDINARY_API_SECRET'] ?? null;

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return new JsonResponse([
                'error' => 'Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $publicIdBase = trim($rawName) !== '' ? $rawName : pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $publicIdBase = preg_replace('/[^A-Za-z0-9\\- _]/', '', $publicIdBase);
        $publicIdBase = str_replace(['  ', ' '], [' ', '-'], $publicIdBase);
        if ($publicIdBase === '') {
            $publicIdBase = 'plant-template';
        }

        $folder = $_ENV['CLOUDINARY_UPLOAD_FOLDER'] ?? 'ravina/plants';

        $tempDir = sys_get_temp_dir();
        $extension = $file->getClientOriginalExtension();
        if (!$extension) {
            $mime = $file->getMimeType() ?? '';
            if (str_contains($mime, 'png')) {
                $extension = 'png';
            } elseif (str_contains($mime, 'webp')) {
                $extension = 'webp';
            } elseif (str_contains($mime, 'gif')) {
                $extension = 'gif';
            } else {
                $extension = 'jpg';
            }
        }
        $tempFilename = uniqid('cloudinary_', true) . '.' . $extension;
        $tempFile = $file->move($tempDir, $tempFilename);
        $uploadedFilePath = $tempFile->getPathname();

        try {
            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => $cloudName,
                    'api_key' => $apiKey,
                    'api_secret' => $apiSecret,
                ],
            ]);

            $result = $cloudinary->uploadApi()->upload(
                $uploadedFilePath,
                [
                    'folder' => $folder,
                    'public_id' => $publicIdBase,
                    'overwrite' => true,
                    'resource_type' => 'image',
                ]
            );
        } catch (ApiError $e) {
            @unlink($uploadedFilePath);
            return new JsonResponse([
                'error' => 'Cloudinary upload failed: ' . $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        } catch (\Throwable $e) {
            @unlink($uploadedFilePath);
            return new JsonResponse([
                'error' => 'Unexpected error during upload: ' . $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        @unlink($uploadedFilePath);

        $secureUrl = $result['secure_url'] ?? null;
        $publicId = $result['public_id'] ?? $publicIdBase;

        return new JsonResponse([
            'imageSlug' => $secureUrl ?? $result['url'] ?? null,
            'publicId' => $publicId,
        ], Response::HTTP_CREATED);
    }
}

