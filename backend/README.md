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


