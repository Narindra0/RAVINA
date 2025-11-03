SUGGESTION_OWNER_ID
--------------------

Pour forcer les suggestions à être basées sur les plantes d'un utilisateur spécifique,
définissez la variable d'environnement suivante côté backend (valeur par défaut: 1):

```bash
SUGGESTION_OWNER_ID=1
```

Le contrôleur `App\\Controller\\PlantSuggestionController` lit cette variable via `$_ENV`.


