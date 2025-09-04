# BDD — API de journaux (PHP 8.3 / MariaDB)
Ce paquet contient le schéma SQL (MLD), ainsi que les scripts pour créer un utilisateur **Symfony** limité aux opérations CRUD (lecture/écriture/modification/suppression) sur les tables.

## Contenu
- `schema.sql` — création de la base, tables, index, et options (InnoDB, utf8mb4).
- `db_user_symfony.sql` — création de l’utilisateur MariaDB dédié à Symfony avec privilèges **SELECT, INSERT, UPDATE, DELETE** sur le schéma.
- `README.md` — ce fichier.

## Hypothèses
- MariaDB ≥ 10.6, moteur **InnoDB**, collation **utf8mb4_unicode_520_ci**.
- Partitionnement mensuel proposé sur `evenement_log` (optionnel; nécessite rôle/admin séparé si vous l’activez).
- L’utilisateur **Symfony** n’a **pas** de privilèges DDL (CREATE/ALTER/DROP). Utiliser un compte **admin** distinct pour les migrations/évolutions.

## Installation rapide
```bash
# 1) Créer la base et le schéma
mysql -u root -p < schema.sql

# 2) Créer l'utilisateur Symfony (adapter hôte, user et mot de passe)
mysql -u root -p < db_user_symfony.sql
```

### Variables à éditer
Dans `db_user_symfony.sql`, remplacez :
- `:DB_NAME` par le nom de votre base (ex. `logs_core`).
- `:SYMFONY_USER` par l’utilisateur souhaité (ex. `symfony_app`).
- `:SYMFONY_PASS` par le mot de passe souhaité.
- `:CLIENT_HOST` par l’hôte autorisé (ex. `localhost` ou `%`).

## Connexion Symfony (exemple `.env.local`)
```
DATABASE_URL="mysql://symfony_app:VOTRE_MOT_DE_PASSE@127.0.0.1:3306/logs_core?serverVersion=mariadb-10.6&charset=utf8mb4"
```

## Notes d’exploitation
- **CRUD uniquement** : l’app Symfony peut insérer/mettre à jour/supprimer/consulter les lignes.  
- **Migrations** : exécutez-les avec un **compte admin** (non inclus ici) ayant CREATE/ALTER/INDEX/…
- **Purge/Partition** : les commandes `ALTER TABLE ... DROP PARTITION` requièrent un compte admin.
- **Sécurité** : dédiez une API key “ingest” côté application, et isolez l’accès réseau (pare-feu/hôte).



## ℹ️ Rétention enrichie
- La table `retention` contient maintenant `description` et `icon` (emoji utf8mb4).
- Icônes proposées : trace=🔍, debug=🐞, info=ℹ️, notice=🔔, warning=⚠️, error=❌, critical=🛑, alert=🚨, emergency=☠️.
