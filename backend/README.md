SUGGESTION_OWNER_ID
--------------------

Pour forcer les suggestions à être basées sur les plantes d'un utilisateur spécifique,
définissez la variable d'environnement suivante côté backend (valeur par défaut: 1):

```bash
SUGGESTION_OWNER_ID=1
```

Le contrôleur `App\\Controller\\PlantSuggestionController` lit cette variable via `$_ENV`.


PLANIFICATION (Railway ou autre Scheduler en ligne)
---------------------------------------------------

La commande `app:plantations:process` doit être exécutée au moins deux fois par jour pour générer les notifications d'arrosage :

- **Matin (7h00-8h00)** : envoie les notifications "Arrosage du {nom} aujourd'hui" si l'arrosage est prévu aujourd'hui
- **Après-midi (16h00)** : envoie les rappels "N'oubliez pas d'arroser votre {nom}" si l'arrosage prévu aujourd'hui n'a pas encore été fait

Sur Railway, créez un Cron Job (ou Scheduler équivalent) avec la commande suivante :

```bash
./bin/run-plantations-process.sh
```

Recommandations :

1. **Deux jobs distincts** (ex. `0 7 * * *` et `0 16 * * *`) pour couvrir matin/fin d’après-midi.  
2. **Variables d’environnement** identiques au service backend (DB, JWT, WhatsApp, etc.).  
3. **Logs** : surveillez la sortie du job dans Railway + `var/log/plantations.log` pour confirmer les envois.

Note : Vous pouvez exécuter la commande (ou le script) plus souvent (toutes les heures) sans risque de doublons grâce aux vérifications intégrées dans le moteur de notifications.

NETTOYAGE DES SNAPSHOTS
-----------------------

Les snapshots de suivi (historique quotidien) peuvent rapidement représenter un volume important. Une commande dédiée supprime les enregistrements plus anciens que la rétention configurée (18 mois par défaut) :

```bash
php bin/console app:snapshots:cleanup            # purge normale
php bin/console app:snapshots:cleanup --dry-run  # affiche uniquement le volume concerné
php bin/console app:snapshots:cleanup --older-than=12  # rétention ponctuelle à 12 mois
```

La durée par défaut est définie via le paramètre `app.snapshots.retention_months` (voir `config/packages/app.yaml`).


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


