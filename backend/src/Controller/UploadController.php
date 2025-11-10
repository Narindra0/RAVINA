<?php

namespace App\Controller;

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

        // Compute target directory: frontend/public/images/plantes (relative to backend project)
        $projectDir = $this->getParameter('kernel.project_dir');
        $targetDir = $projectDir . '/../frontend/public/images/plantes';
        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0775, true);
        }

        // Build filename based on provided name or original name (without extension), keep original extension
        $base = trim($rawName) !== '' ? $rawName : pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        // Normalize filename: remove unsafe chars, keep spaces/hyphens/underscores, then convert spaces to hyphens
        $base = preg_replace('/[^A-Za-z0-9\- _]/', '', $base);
        $base = str_replace(['  ', ' '], [' ', '-'], $base);
        $base = str_replace('__', '_', str_replace('--', '-', $base));
        if ($base === '' ) {
            $base = 'image';
        }
        // Determine extension from client mime or original name
        $clientMime = (string) $file->getClientMimeType();
        $ext = strtolower(pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION) ?: 'jpg');
        if ($ext === 'jpeg') { $ext = 'jpg'; }
        if (!$ext) {
            if (str_contains($clientMime, 'png')) $ext = 'png';
            elseif (str_contains($clientMime, 'webp')) $ext = 'webp';
            else $ext = 'jpg';
        }

        $targetFilename = $base . '.' . $ext;
        $targetPath = $targetDir . DIRECTORY_SEPARATOR . $targetFilename;

        // Move uploaded file directly to target (overwrite if exists)
        $tempPath = $targetDir . DIRECTORY_SEPARATOR . uniqid('upl_', true) . '.' . $ext;
        $file->move($targetDir, basename($tempPath));
        // Rename temp to final name (atomic move)
        @rename($tempPath, $targetPath);

        return new JsonResponse(['imageSlug' => $targetFilename], Response::HTTP_CREATED);
    }
}

