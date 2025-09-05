# 📖 Journal Logs API — Symfony + MariaDB

## 🚀 Objectifs

- Centraliser **tous les logs** de tes sites web et applications dans une **API unique**.
- Offrir un **Front** pour explorer, filtrer et analyser les événements.
- Mettre en place un système d’**alertes** et de **statistiques**.
- Prévoir la **sécurité**, la **scalabilité** et la **maintenance** dès le départ.

---

## 1️⃣ Périmètre MVP

- Ingestion des logs par API (HTTP POST).
- Stockage structuré dans MariaDB.
- Recherche / filtres par source, niveau, période.
- Alertes basées sur des règles simples.
- Tableaux de bord (volumétrie, top erreurs, temps de réponse).
- Authentification via **JWT** et/ou **API-Key**.

---

## 2️⃣ Architecture

- **Backend** : Symfony 7, Doctrine, Messenger, Monolog.
- **DB** : MariaDB (InnoDB + partitions mensuelles).
- **Queue** : Redis ou RabbitMQ pour ingestion asynchrone.
- **Auth** : JWT + API-Key par client.
- **Front** :
  - Option A : Symfony + Twig (Bootstrap 5)
  - Option B : SPA (React/Vue)

---

## 3️⃣ Schéma des données

### Table `log_event`
| Colonne      | Type        | Description |
|--------------|------------|-------------|
| id           | BIGINT PK  | Identifiant unique |
| ts           | DATETIME(6)| Horodatage de l’événement |
| source       | VARCHAR(100)| Origine (ex: wordpress, symfony) |
| env          | ENUM(dev,test,prod) | Environnement |
| level        | ENUM(...)  | Niveau de log |
| message      | VARCHAR(1024) | Message |
| context      | JSON       | Contexte libre (userId, url, stacktrace…) |
| tags         | JSON       | Liste de tags |
| fingerprint  | CHAR(64)   | Hash pour déduplication |
| host         | VARCHAR(128)| Hôte source |
| ip           | VARBINARY(16)| Adresse IP |
| duration_ms  | INT        | Durée éventuelle |
| http_status  | SMALLINT   | Code HTTP |
| created_at   | DATETIME(6)| Création |

Autres tables :
- **log_client** : gestion des clés API et sources.
- **alert_rule** : règles d’alerte.
- **alert_hit** : historique des déclenchements.

---

## 4️⃣ Flux d’ingestion

### Endpoint
`POST /api/logs/ingest`

### Exemple payload
```json
{
  "source": "wordpress",
  "env": "prod",
  "level": "error",
  "message": "DB connection timeout",
  "context": {
    "site": "corbisier.fr",
    "url": "/api/login",
    "userId": 123
  },
  "tags": ["db","auth"],
  "duration_ms": 240,
  "http_status": 500,
  "ts": "2025-09-03T10:27:14.123Z"
}
```

### Exemple cURL
```bash
curl -X POST https://logs.example.com/api/logs/ingest   -H "Content-Type: application/json"   -H "X-API-Key: <client-key>"   -d @event.json
```

---

## 5️⃣ API (lecture & stats)

- `GET /api/logs` → recherche avec filtres.
- `GET /api/logs/{id}` → détail d’un log.
- `GET /api/stats/volume` → volumétrie.
- `GET /api/stats/top-errors` → top erreurs.
- `POST /api/alerts` → gestion des règles d’alerte.

---

## 6️⃣ Frontend

- **Vue Explore** : filtres + tableau des logs.
- **Dashboards** :
  - Volume par période
  - Taux d’erreurs
  - Top sources / top messages
- **Alertes** : création, édition, suivi.

---

## 7️⃣ Sécurité

- TLS obligatoire.
- Auth via JWT ou API-Key.
- Rate limiting par clé.
- Validation stricte du JSON.
- Retention / purge (90 jours, puis archive).
- RGPD : éviter données perso en clair.

---

## 8️⃣ Performance

- Partitions mensuelles (MariaDB).
- Inserts en batch (Messenger handler).
- Index sur `(ts)`, `(source, ts)`, `(level, ts)`.
- Fulltext sur `message` si nécessaire.

---

## 9️⃣ Squelette Symfony

```
src/
  Controller/
    IngestController.php
    LogsQueryController.php
    StatsController.php
    AlertsController.php
  Message/
    LogIngested.php
  MessageHandler/
    LogIngestedHandler.php
  Entity/
    LogEvent.php
    AlertRule.php
    AlertHit.php
    LogClient.php
  Repository/
    LogEventRepository.php
  Security/
    ApiKeyAuthenticator.php
    JwtAuthenticator.php
  Service/
    FingerprintService.php
    QueryBuilderService.php
    AlertEvaluator.php
    NotificationSender.php
  Command/
    RotatePartitionsCommand.php
    PurgeOldLogsCommand.php
config/
  packages/{doctrine,messenger,security,rate_limiter}.yaml
migrations/
```

---

## 🔟 Config `.env`

```dotenv
APP_ENV=prod
DB_URL="mysql://user:pass@db:3306/logs?charset=utf8mb4"
JWT_SECRET="***"
RATE_LIMIT_LOGS_PER_MIN=600
ALERT_EMAIL_FROM="logs@exemple.com"
```

---

## 1️⃣1️⃣ CI/CD & Ops

- Docker Compose : php-fpm, nginx, mariadb, redis/rabbitmq, worker.
- CI : PHPStan, PHPUnit, migrations automatiques.
- Healthcheck `/healthz`.
- Backup + restauration testées.

---

## 1️⃣2️⃣ Tests

- Unitaires : services.
- Intégration : ingestion → DB.
- Contrats : schéma JSON ingestion.
- Charge : Locust/k6 (10k events/min).

---

## 1️⃣3️⃣ Connecteurs

- PHP/WordPress : Monolog HttpHandler.
- Symfony : channel dédié.
- JS Front : fetch error logs.
- Nginx/Apache : parseur → POST.
- Android (MacroDroid) : HTTP POST.

---

## 1️⃣4️⃣ Alertes

- Worker CRON toutes les 60s.
- Évaluation des règles (COUNT sur fenêtre de temps).
- Déclenchement → email/webhook.
- Historique en DB.

---

## ✅ Next Steps

1. Créer repo Symfony + Docker Compose + migrations initiales.  
2. Développer endpoint `/api/logs/ingest`.  
3. Implémenter worker Messenger pour DB.  
4. Construire Front Explore (logs list + détails).  
5. Ajouter stats et premières règles d’alerte.  
6. Mettre en place partitions et purge automatique.
