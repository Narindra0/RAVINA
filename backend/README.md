SUGGESTION_OWNER_ID
--------------------

Pour forcer les suggestions à être basées sur les plantes d'un utilisateur spécifique,
définissez la variable d'environnement suivante côté backend (valeur par défaut: 1):

```bash
SUGGESTION_OWNER_ID=1
```

Le contrôleur `App\\Controller\\PlantSuggestionController` lit cette variable via `$_ENV`.


CONFIGURATION CRON
------------------

La commande `app:plantations:process` doit être exécutée au moins deux fois par jour pour générer les notifications d'arrosage :

- **Matin (7h00-8h00)** : Envoie les notifications "Arrosage du {nom} aujourd'hui" si l'arrosage est prévu aujourd'hui
- **Après-midi (16h00)** : Envoie les rappels "N'oubliez pas d'arroser votre {nom}" si l'arrosage prévu aujourd'hui n'a pas encore été fait

### Configuration crontab recommandée

```bash
# Matin : notification "Arrosage aujourd'hui"
0 7 * * * cd /path/to/ravina/backend && php bin/console app:plantations:process

# Après-midi : rappel si non fait
0 16 * * * cd /path/to/ravina/backend && php bin/console app:plantations:process
```

Remplacez `/path/to/ravina/backend` par le chemin absolu vers le répertoire backend de votre installation RAVINA.

Note : La commande peut également être exécutée plus fréquemment (par exemple toutes les heures) sans risque de doublons grâce aux vérifications intégrées dans le moteur de notifications.


NOTIFICATIONS WHATSAPP
----------------------

Les notifications générées par `NotificationEngine` peuvent désormais être relayées vers WhatsApp Cloud API.

1. **Variables d'environnement** (Railway/`.env.local`) :
   ```
   WHATSAPP_ENABLED=true
   WHATSAPP_ACCESS_TOKEN=<token Graph API>
   WHATSAPP_PHONE_NUMBER_ID=<phone_number_id>
   WHATSAPP_API_VERSION=v19.0
   WHATSAPP_API_BASE_URI=https://graph.facebook.com
   WHATSAPP_TEMPLATE_NAME=<template approuvé ou laissez vide pour texte libre>
   WHATSAPP_TEMPLATE_LANGUAGE=fr
   WHATSAPP_VERIFY_TOKEN=<token utilisé pour la vérification du webhook>
   ```
   Exemple Railway :
   ```
   railway variables set WHATSAPP_ENABLED=true \
       WHATSAPP_ACCESS_TOKEN=EAAG... \
       WHATSAPP_PHONE_NUMBER_ID=1234567890 \
       WHATSAPP_TEMPLATE_NAME=ravina_alert
   ```

2. **Format des numéros** : la colonne `user.numeroTelephone` doit contenir un numéro WhatsApp valide au format international (ex. `+261340000000`). Une migration de données peut normaliser les entrées existantes.

3. **Endpoint manuel** : `POST /api/notifications/whatsapp` (JWT requis) permet de déclencher un envoi à l'utilisateur connecté ou, pour un admin, à un `userId` donné.
   ```json
   {
     "title": "Test WhatsApp",
     "message": "Ce message valide la configuration.",
     "userId": 12
   }
   ```
   Réponse attendue :
   ```json
   { "status": "sent", "to": "+261..." }
   ```

4. **Logs et surveillance** : les erreurs HTTP sont consignées via Monolog. Vérifiez les quotas/conversations directement dans Business Manager.

5. **Webhook Meta** : exposez `https://<backend>/webhook/whatsapp` dans Meta. La vérification se fait via `WHATSAPP_VERIFY_TOKEN`, et chaque événement entrant est consigné dans les logs applicatifs.


