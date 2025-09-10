-- Journal Logs API - Schéma initial (MariaDB)
-- Encodage: UTF8MB4, moteur: InnoDB

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Optionnel: définir la base si besoin
-- CREATE DATABASE IF NOT EXISTS logs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE logs;

-- Table des clients (clé API)
CREATE TABLE IF NOT EXISTS log_client (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  api_key CHAR(64) NOT NULL, -- stocker une clé aléatoire hex (ou un hash)
  sources JSON NULL, -- liste de sources autorisées
  active TINYINT(1) NOT NULL DEFAULT 1,
  rate_limit_per_min INT NOT NULL DEFAULT 600,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_api_key (api_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des événements de log
CREATE TABLE IF NOT EXISTS log_event (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ts DATETIME(6) NOT NULL,
  source VARCHAR(100) NOT NULL,
  env ENUM('dev','test','prod') NOT NULL,
  level ENUM('trace','debug','info','notice','warning','error','critical','alert','emergency') NOT NULL,
  message VARCHAR(1024) NOT NULL,
  context JSON NULL,
  tags JSON NULL,
  fingerprint CHAR(64) NOT NULL,
  host VARCHAR(128) NULL,
  ip VARBINARY(16) NULL, -- IPv4 ou IPv6 (packed)
  duration_ms INT NULL,
  http_status SMALLINT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_ts (ts),
  KEY idx_source_ts (source, ts),
  KEY idx_level_ts (level, ts),
  KEY idx_fingerprint (fingerprint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FULLTEXT sur message (si version MariaDB/InnoDB compatible)
-- CREATE FULLTEXT INDEX ftx_message ON log_event (message);

-- Règles d'alerte
CREATE TABLE IF NOT EXISTS alert_rule (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  source VARCHAR(100) NULL,
  level ENUM('trace','debug','info','notice','warning','error','critical','alert','emergency') NULL,
  threshold_count INT NOT NULL,
  window_seconds INT NOT NULL,
  target_type ENUM('email','webhook') NOT NULL,
  target_value VARCHAR(255) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Déclenchements d'alertes
CREATE TABLE IF NOT EXISTS alert_hit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rule_id BIGINT UNSIGNED NOT NULL,
  matched_count INT NOT NULL,
  window_start DATETIME(6) NOT NULL,
  window_end DATETIME(6) NOT NULL,
  first_event_id BIGINT UNSIGNED NULL,
  last_event_id BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_rule_time (rule_id, window_start),
  CONSTRAINT fk_hit_rule FOREIGN KEY (rule_id) REFERENCES alert_rule(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commentaire: prévoir des partitions mensuelles sur log_event(ts)
-- Exemple (à adapter):
-- ALTER TABLE log_event PARTITION BY RANGE (TO_DAYS(ts)) (
--   PARTITION p2025_09 VALUES LESS THAN (TO_DAYS('2025-10-01')),
--   PARTITION pmax VALUES LESS THAN MAXVALUE
-- );

