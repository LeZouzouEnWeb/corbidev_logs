-- =============================================================
-- Création d'un utilisateur Symfony avec droits CRUD uniquement
-- =============================================================
-- ÉDITEZ les placeholders avant exécution :
--   :DB_NAME       -> nom de la base (ex. logs_core)
--   :SYMFONY_USER  -> nom d'utilisateur (ex. symfony_app)
--   :SYMFONY_PASS  -> mot de passe (ex. motDePasse!Solide)
--   :CLIENT_HOST   -> hôte autorisé (ex. 'localhost' ou '%' ou '10.0.%')
-- NB: Utilisez un compte root/admin pour exécuter ce script.

SET @db_name      := ':DB_NAME';
SET @user_name    := ':SYMFONY_USER';
SET @user_pass    := ':SYMFONY_PASS';
SET @client_host  := ':CLIENT_HOST';

SET @fq_user := CONCAT("'", @user_name, "'@'", @client_host, "'"); 

-- Crée l'utilisateur (échoue si existe déjà)
SET @sql := CONCAT('CREATE USER IF NOT EXISTS ', @fq_user, ' IDENTIFIED BY ', QUOTE(@user_pass), ';');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Accorde les privilèges CRUD uniquement sur toutes les tables du schéma
SET @sql := CONCAT('GRANT SELECT, INSERT, UPDATE, DELETE ON `', @db_name, '`.* TO ', @fq_user, ';');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Optionnel : si vous utilisez des vues, SELECT suffit ; pas de privilèges DDL accordés.
-- Rafraîchir les privilèges
FLUSH PRIVILEGES;

-- Vérification rapide (affiche les privilèges)
SHOW GRANTS FOR :SYMFONY_USER@:CLIENT_HOST;
