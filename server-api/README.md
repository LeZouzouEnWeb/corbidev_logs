# Journal Logs API — Plan d'implémentation

Ce dossier regroupe le contrat d'API (OpenAPI) et le schéma SQL initial pour démarrer l'API de collecte et de consultation de logs.

## Contenu

- `openapi.yaml` — Spécification OpenAPI 3.0 des endpoints (ingestion, recherche, stats)
- `sql/001_init.sql` — Schéma MariaDB (tables `log_event`, `log_client`, alertes)

## Endpoints (extraits)

- `POST /api/logs/ingest` — Ingestion d'un événement (clé API requise via `X-API-Key`)
- `GET /api/logs` — Recherche filtrée et paginée
- `GET /api/logs/{id}` — Détail d'un log
- `GET /api/stats/volume` — Volumétrie dans un intervalle
- `GET /api/stats/top-errors` — Top messages d'erreurs

Voir `openapi.yaml` pour le détail des schémas, paramètres et réponses.

## Base de données

- `log_client` — Clients, clés API, quotas (rate limit)
- `log_event` — Événements de logs
- `alert_rule`, `alert_hit` — Règles et déclenchements d'alertes

Indexes majeurs: `(ts)`, `(source, ts)`, `(level, ts)`, `(fingerprint)`.

Optionnel: FULLTEXT sur `message` et partitions mensuelles sur `log_event(ts)`.

## Prochaines étapes (Symfony)

1) Init projet Symfony (7.x), Docker Compose (php-fpm, nginx, mariadb, redis/rabbitmq)
2) Entités Doctrine selon `sql/001_init.sql`
3) Auth API-Key (`X-API-Key`) avec rate limiter par client
4) Endpoint `/api/logs/ingest` avec validation JSON (Symfony Validator) et fingerprinting
5) Ingestion asynchrone (Messenger) + handler d'insert en DB
6) Endpoints de lecture + repo/QueryBuilder (filtres, pagination)
7) Stats (agrégations SQL) et premiers dashboards
8) Alertes (CRON worker), envoi e-mail/webhook

## cURL — exemple ingestion

```bash
curl -X POST http://localhost:8080/api/logs/ingest \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <client-key>' \
  -d '{
    "source":"wordpress",
    "env":"prod",
    "level":"error",
    "message":"DB connection timeout",
    "context":{"site":"corbisier.fr","url":"/api/login","userId":123},
    "tags":["db","auth"],
    "duration_ms":240,
    "http_status":500,
    "ts":"2025-09-03T10:27:14.123Z"
  }'
```

