# Import sur IONOS (mutualisé)

- **Ne pas** utiliser `CREATE DATABASE` / `USE` dans le fichier.
- Crée d’abord la base dans le **panneau IONOS**.
- Dans **phpMyAdmin** :
  1. Clique sur la base (menu gauche) pour la sélectionner.
  2. Onglet **Importer** → choisis `schema_ionos.sql` (ce fichier).
- Si la collation `utf8mb4_unicode_520_ci` n’est pas disponible, remplace-la par `utf8mb4_unicode_ci` puis réimporte.
