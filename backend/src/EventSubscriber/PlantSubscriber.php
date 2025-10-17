<?php

namespace App\EventSubscriber;

use ApiPlatform\Symfony\EventListener\EventPriorities;
use App\Entity\Plant;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\Security\Core\Security;
use Symfony\Component\HttpKernel\KernelEvents;

class PlantSubscriber implements EventSubscriberInterface
{
    public function __construct(private Security $security) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['setUserForPlant', EventPriorities::PRE_WRITE],
        ];
    }

    public function setUserForPlant(ViewEvent $event): void
    {
        $plant = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();

        if (!$plant instanceof Plant || $method !== 'POST') {
            return;
        }

        $user = $this->security->getUser();
        $plant->setUser($user);
    }
}
