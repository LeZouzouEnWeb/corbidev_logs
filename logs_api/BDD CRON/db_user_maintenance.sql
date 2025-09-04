-- =============================================================
-- Utilisateur SQL dédié à la maintenance (CRON) — droits minimaux
-- Adapter :DB_NAME, :MAINT_USER, :MAINT_PASS, :CLIENT_HOST
-- =============================================================
SET @db_name     := ':DB_NAME';
SET @user_name   := ':MAINT_USER';
SET @user_pass   := ':MAINT_PASS';
SET @client_host := ':CLIENT_HOST';

SET @fq_user := CONCAT("'", @user_name, "'@'", @client_host, "'");

-- Crée l'utilisateur s'il n'existe pas
SET @sql := CONCAT('CREATE USER IF NOT EXISTS ', @fq_user, ' IDENTIFIED BY ', QUOTE(@user_pass), ';');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Droits CRUD nécessaires à la purge (retention)
SET @sql := CONCAT('GRANT SELECT, DELETE ON `', @db_name, '`.* TO ', @fq_user, ';');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Droits de gestion des partitions sur la table principale
SET @sql := CONCAT('GRANT ALTER, CREATE, DROP ON `', @db_name, '`.`evenement_log` TO ', @fq_user, ';');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

FLUSH PRIVILEGES;

-- Vérification
SHOW GRANTS FOR :MAINT_USER@:CLIENT_HOST;
