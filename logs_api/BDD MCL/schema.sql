-- =============================================================
-- Schéma BDD — API journaux (MLD) — MariaDB >= 10.6
-- =============================================================
-- Remplacez `logs_core` si besoin.
CREATE DATABASE IF NOT EXISTS `logs_core`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_520_ci;
USE `logs_core`;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_520_ci;

-- ====================== TABLES DE RÉFÉRENCE ======================
CREATE TABLE IF NOT EXISTS projet (
  id_projet      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom            VARCHAR(120) NOT NULL,
  code           VARCHAR(64) NOT NULL UNIQUE,
  actif          TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS application (
  id_app         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_projet      BIGINT UNSIGNED NOT NULL,
  nom            VARCHAR(120) NOT NULL,
  type           VARCHAR(40)  NOT NULL, -- web, api, mobile, job...
  langage        VARCHAR(40)  NULL,     -- php, js, java...
  repo           VARCHAR(255) NULL,
  actif          TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_projet FOREIGN KEY (id_projet) REFERENCES projet(id_projet)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS environnement (
  id_env         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom            VARCHAR(40) NOT NULL UNIQUE -- dev/test/prod
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_env (
  id_app_env     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_app         BIGINT UNSIGNED NOT NULL,
  id_env         BIGINT UNSIGNED NOT NULL,
  base_url       VARCHAR(255) NULL,
  version_deploiement VARCHAR(80) NULL,
  actif          TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uk_app_env (id_app, id_env),
  CONSTRAINT fk_ae_app  FOREIGN KEY (id_app) REFERENCES application(id_app),
  CONSTRAINT fk_ae_env  FOREIGN KEY (id_env) REFERENCES environnement(id_env)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS source (
  id_source      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_app_env     BIGINT UNSIGNED NOT NULL,
  hostname       VARCHAR(120) NOT NULL,
  runtime        VARCHAR(60)  NULL, -- php-fpm, node, cli...
  version_runtime VARCHAR(60) NULL,
  region         VARCHAR(60)  NULL,
  instance_id    VARCHAR(120) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_src_host (hostname),
  CONSTRAINT fk_src_ae FOREIGN KEY (id_app_env) REFERENCES app_env(id_app_env)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS client (
  id_client      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type           VARCHAR(40)  NOT NULL, -- web, mobile, iot
  os             VARCHAR(80)  NULL,
  user_agent     VARCHAR(255) NULL,
  device_id      VARCHAR(120) NULL,
  KEY idx_cli_device (device_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS utilisateur_ext (
  id_user_ext    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ext_user_id    VARCHAR(120) NULL,
  email_hash     CHAR(64) NULL, -- SHA-256 (pas de PII en clair)
  UNIQUE KEY uk_user_ext (ext_user_id, email_hash)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ip_address (
  id_ip          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  adresse_bin    VARBINARY(16) NOT NULL,
  version        TINYINT NOT NULL, -- 4 ou 6
  UNIQUE KEY uk_ip (adresse_bin)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stacktrace (
  id_stack       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hash_sig       CHAR(64) NOT NULL UNIQUE,
  frames_json    JSON NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fingerprint (
  id_fp          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hash_fp        CHAR(64) NOT NULL UNIQUE,
  niveau         ENUM('trace','debug','info','notice','warning','error','critical','alert','emergency') NOT NULL,
  categorie      VARCHAR(120) NULL,
  code_erreur    VARCHAR(120) NULL,
  first_seen     DATETIME(3) NOT NULL,
  last_seen      DATETIME(3) NOT NULL,
  occurrences    BIGINT UNSIGNED NOT NULL DEFAULT 1,
  dernier_id_log BIGINT UNSIGNED NULL
) ENGINE=InnoDB;

-- ====================== TABLE PRINCIPALE LOGS ======================
CREATE TABLE IF NOT EXISTS evenement_log (
  id_log         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_app_env     BIGINT UNSIGNED NOT NULL,
  id_source      BIGINT UNSIGNED NULL,
  id_client      BIGINT UNSIGNED NULL,
  id_user_ext    BIGINT UNSIGNED NULL,
  id_ip          BIGINT UNSIGNED NULL,
  id_stack       BIGINT UNSIGNED NULL,
  id_fp          BIGINT UNSIGNED NULL,

  niveau         ENUM('trace','debug','info','notice','warning','error','critical','alert','emergency') NOT NULL,
  categorie      VARCHAR(120) NULL,
  message        TEXT NOT NULL,

  event_ts       DATETIME(3) NOT NULL,
  received_ts    DATETIME(3) NOT NULL,
  trace_id       VARCHAR(64) NULL,
  span_id        VARCHAR(64) NULL,
  request_id     VARCHAR(64) NULL,
  session_id     VARCHAR(64) NULL,

  http_method    VARCHAR(10) NULL,
  http_status    SMALLINT NULL,
  url            VARCHAR(512) NULL,
  latency_ms     INT NULL,
  bytes_in       INT NULL,
  bytes_out      INT NULL,
  cpu_pct        DECIMAL(5,2) NULL,
  mem_mb         DECIMAL(8,2) NULL,

  stack_sig      CHAR(64) NULL,
  context_json   JSON NULL,

  KEY idx_ev_app_env_time (id_app_env, event_ts),
  KEY idx_ev_level_time (niveau, event_ts),
  KEY idx_ev_fp (id_fp),
  KEY idx_ev_stack (id_stack),
  KEY idx_ev_http (http_status),
  KEY idx_ev_trace (trace_id),
  FULLTEXT KEY ftx_ev_msg (message),

  CONSTRAINT fk_ev_ae   FOREIGN KEY (id_app_env) REFERENCES app_env(id_app_env),
  CONSTRAINT fk_ev_src  FOREIGN KEY (id_source)  REFERENCES source(id_source),
  CONSTRAINT fk_ev_cli  FOREIGN KEY (id_client)  REFERENCES client(id_client),
  CONSTRAINT fk_ev_usr  FOREIGN KEY (id_user_ext) REFERENCES utilisateur_ext(id_user_ext),
  CONSTRAINT fk_ev_ip   FOREIGN KEY (id_ip)      REFERENCES ip_address(id_ip),
  CONSTRAINT fk_ev_stack FOREIGN KEY (id_stack)  REFERENCES stacktrace(id_stack),
  CONSTRAINT fk_ev_fp    FOREIGN KEY (id_fp)     REFERENCES fingerprint(id_fp)
) ENGINE=InnoDB;

-- NOTE: Le partitionnement mensuel est conseillé mais nécessite un compte admin.
-- Exemple (à exécuter avec un compte ayant ALTER PARTITION) :
-- ALTER TABLE evenement_log
--   PARTITION BY RANGE (YEAR(event_ts)*100 + MONTH(event_ts)) (
--     PARTITION p2025_09 VALUES LESS THAN (202509),
--     PARTITION pmax     VALUES LESS THAN MAXVALUE
--   );

CREATE TABLE IF NOT EXISTS kv_log (
  id_log         BIGINT UNSIGNED NOT NULL,
  cle            VARCHAR(120) NOT NULL,
  type_val       ENUM('s','n','b','j','d') NOT NULL, -- string, number, bool, json, date
  valeur_s       TEXT NULL,
  valeur_n       DECIMAL(30,10) NULL,
  valeur_b       TINYINT(1) NULL,
  valeur_j       JSON NULL,
  valeur_d       DATETIME(3) NULL,
  PRIMARY KEY (id_log, cle),
  KEY idx_kv_cle (cle),
  CONSTRAINT fk_kv_log FOREIGN KEY (id_log) REFERENCES evenement_log(id_log) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tag (
  id_tag         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom            VARCHAR(64) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS log_tag (
  id_log         BIGINT UNSIGNED NOT NULL,
  id_tag         BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_log, id_tag),
  KEY idx_lt_tag (id_tag),
  CONSTRAINT fk_lt_log FOREIGN KEY (id_log) REFERENCES evenement_log(id_log) ON DELETE CASCADE,
  CONSTRAINT fk_lt_tag FOREIGN KEY (id_tag) REFERENCES tag(id_tag) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerte_regle (
  id_regle       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_app         BIGINT UNSIGNED NULL,
  id_env         BIGINT UNSIGNED NULL,
  nom            VARCHAR(120) NOT NULL,
  description    TEXT NULL,
  condition_dsl  VARCHAR(512) NOT NULL,      -- ex: "niveau='error' AND count>=10"
  fenetre_sec    INT NOT NULL DEFAULT 300,
  seuil          INT NOT NULL DEFAULT 1,
  severite       ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  actif          TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ar_app FOREIGN KEY (id_app) REFERENCES application(id_app),
  CONSTRAINT fk_ar_env FOREIGN KEY (id_env) REFERENCES environnement(id_env)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerte_canal (
  id_canal       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type           ENUM('email','webhook','slack','sms') NOT NULL,
  cible          VARCHAR(255) NOT NULL,
  meta_json      JSON NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerte_regle_canal (
  id_regle       BIGINT UNSIGNED NOT NULL,
  id_canal       BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_regle, id_canal),
  CONSTRAINT fk_arc_regle FOREIGN KEY (id_regle) REFERENCES alerte_regle(id_regle) ON DELETE CASCADE,
  CONSTRAINT fk_arc_canal FOREIGN KEY (id_canal) REFERENCES alerte_canal(id_canal) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerte_evenement (
  id_evt_alerte  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_regle       BIGINT UNSIGNED NOT NULL,
  statut         ENUM('open','ack','closed') NOT NULL DEFAULT 'open',
  first_triggered DATETIME(3) NOT NULL,
  last_triggered  DATETIME(3) NOT NULL,
  occurrences    INT NOT NULL DEFAULT 1,
  details_json   JSON NULL,
  last_notified_at DATETIME(3) NULL,
  CONSTRAINT fk_ae_regle FOREIGN KEY (id_regle) REFERENCES alerte_regle(id_regle)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS api_key (
  id_key         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cle_pub        VARCHAR(64) NOT NULL UNIQUE,  -- identifiant public
  cle_hash       CHAR(64) NOT NULL,            -- hash (ex: SHA-256) du secret
  scopes         VARCHAR(255) NOT NULL,        -- "ingest,read,admin"
  actif          TINYINT(1) NOT NULL DEFAULT 1,
  derniere_utilisation DATETIME NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS retention (
  id_retention   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_app         BIGINT UNSIGNED NOT NULL,
  niveau         ENUM('trace','debug','info','notice','warning','error','critical','alert','emergency') NOT NULL,
  nb_jours       INT NOT NULL,
  description    VARCHAR(255) NOT NULL,
  icon           VARCHAR(16) NOT NULL, -- emoji ou nom d’icône (utf8mb4)
  CONSTRAINT fk_ret_app FOREIGN KEY (id_app) REFERENCES application(id_app),
  UNIQUE KEY uk_ret (id_app, niveau)
) ENGINE=InnoDB;

-- =============================================================
-- Rétention par défaut pour toutes les applications (idempotent)
-- - Insère 1 règle par niveau si manquante, avec description + icône
-- - Icônes proposées (emoji utf8mb4) : 
--   trace=🔍, debug=🐞, info=ℹ️, notice=🔔, warning=⚠️, error=❌, critical=🛑, alert=🚨, emergency=☠️
-- =============================================================
DROP TEMPORARY TABLE IF EXISTS retention_defaults;

CREATE TEMPORARY TABLE retention_defaults (
  niveau ENUM('trace','debug','info','notice','warning','error','critical','alert','emergency'),
  nb_jours INT,
  description VARCHAR(255),
  icon VARCHAR(16)
);

INSERT INTO retention_defaults (niveau, nb_jours, description, icon) VALUES
  ('trace',     3,   'Détails extrêmement fins, surtout utiles en développement.', '🔍'),
  ('debug',     7,   'Informations techniques utiles aux développeurs pour diagnostiquer.', '🐞'),
  ('info',      30,  'Événements normaux et attendus (connexions, exécutions de tâches).', 'ℹ️'),
  ('notice',    60,  'Comportement inhabituel mais non bloquant (préventif).', '🔔'),
  ('warning',   90,  'Problème potentiel ou anomalie tolérée.', '⚠️'),
  ('error',     180, 'Erreur impactant une fonctionnalité ; le système reste utilisable.', '❌'),
  ('critical',  365, 'Dysfonctionnement critique d’un sous-système essentiel.', '🛑'),
  ('alert',     365, 'Situation urgente nécessitant une action immédiate.', '🚨'),
  ('emergency', 730, 'Panne totale : le système est inutilisable.', '☠️');

-- Applique à toutes les applications : insère les règles manquantes
INSERT INTO retention (id_app, niveau, nb_jours, description, icon)
SELECT a.id_app, d.niveau, d.nb_jours, d.description, d.icon
FROM application a
CROSS JOIN retention_defaults d
WHERE NOT EXISTS (
  SELECT 1 FROM retention r WHERE r.id_app = a.id_app AND r.niveau = d.niveau
);

DROP TEMPORARY TABLE retention_defaults;
