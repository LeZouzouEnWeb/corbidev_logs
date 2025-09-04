# Scripts CRON — Partitions & Rétention (PHP 8.3 / MariaDB)

Ce paquet fournit **2 scripts CLI PHP** pour la maintenance de la base de logs :
- `cron_rotate_partitions.php` : ajoute la **partition du mois suivant** et supprime les **partitions trop anciennes**.
- `cron_purge_retention.php` : applique la **rétention par niveau et par application** (table `retention`).

Un utilisateur SQL dédié (**maintenance**) est fourni avec les **droits minimaux** nécessaires.

## Installation

1) Créer l’utilisateur maintenance (adapter les placeholders dans le fichier) :
```bash
mysql -u root -p < db_user_maintenance.sql
```

2) Déposer les scripts PHP (exécutables) sur le serveur (ex. `/opt/logs-maint/`).
3) Configurer les **variables d’environnement** pour la connexion DB (exemple) :
```bash
export LOGS_DB_DSN="mysql:host=127.0.0.1;port=3306;dbname=logs_core;charset=utf8mb4"
export LOGS_DB_USER="logs_maint"
export LOGS_DB_PASS="votreMotDePasseFort"
# Paramètres optionnels
export LOGS_KEEP_MONTHS="18"     # horizon global pour DROP PARTITION (par défaut 18)
export LOGS_BATCH_DELETE="20000" # taille des lots DELETE (par défaut 20000)
```

4) Crontab (exemples) :
```bash
# Ajouter chaque 1er du mois la partition suivante + drop vieux mois
0 3 1 * * /usr/bin/php -d detect_unicode=0 /opt/logs-maint/cron_rotate_partitions.php >> /var/log/logs-maint/partitions.log 2>&1

# Purge fine par rétention, tous les jours à 03:30
30 3 * * * /usr/bin/php -d detect_unicode=0 /opt/logs-maint/cron_purge_retention.php >> /var/log/logs-maint/retention.log 2>&1
```

## Droits SQL nécessaires

- **Rétention** : `SELECT`, `DELETE` sur le schéma `logs_core`.
- **Partitions** : `ALTER`, `CREATE`, `DROP` sur la table `logs_core.evenement_log`.

Ces droits sont accordés par `db_user_maintenance.sql`.

## Sécurité
- Utiliser un **mot de passe fort** et restreindre l’`HOST` (ex. `localhost` au lieu de `%`).
- Les scripts n’exposent pas de credentials en clair : utilisez les **variables d’environnement**.

