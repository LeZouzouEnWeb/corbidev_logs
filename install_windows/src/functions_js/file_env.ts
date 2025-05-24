import { v4 as uuidv4 } from 'uuid'; // Importation du générateur d'UUID
import {
    BDD,
    FOLDER_REL_BASE,
    FOLDER_REL_SERVER_BACK,
    FOLDER_REL_SERVER_FRONT,
    PORT_BACKEND
} from './variables';
import { createFiles } from './folder_file';

// Déstructuration des variables
const {
    name,
    basedb,
    version_default,
    version_mariadb,
    version_adminer,
    folderDatabase,
    folderServeurBack,
    port_symfony
} = BDD;

// Variables communes pour les fichiers .env
const commonVariables = `
NAME=${name}
BASE=${basedb}

###> VERSIONS ###
BACKEND_VERSION=${version_default}
MARIADB_VERSION=${version_mariadb}
ADMINER_VERSION=${version_adminer}
###< VERSIONS ###

###> MYSQL/ mariadb - adminer ###
NAME_BDD=\${NAME}_\${BASE}
MYSQL_HOST=${folderDatabase}
MYSQL_ROOT_PASSWORD=P@ssW0rd!
MYSQL_DATABASE=\${NAME}
MYSQL_USER=user
MYSQL_PASSWORD=password

MYSQL_USER_API=api
MYSQL_PASSWORD_API=password

ADMINER_DEFAULT_SERVER=\${MYSQL_HOST}
ADMINER_DEFAULT_DRIVER=mySQL
ADMINER_DEFAULT_DB_NAME=\${MYSQL_DATABASE}
###< MYSQL/ mariadb - adminer ###

###> PORTS ###
SQL_DOCKER_PORT=3306
SQL_LOCALHOST_PORT=3388

MAILER_DOCKER_SMTP_PORT=1025
MAILER_LOCALHOST_SMTP_PORT=1025

MAILER_DOCKER_HTML_PORT=8025
MAILER_LOCALHOST_HTML_PORT=8025

HTTPS_LOCALHOST_PORT=443
HTTP3_LOCALHOST_PORT=443
`;

// Fonction pour générer des clés UUID pour la sécurité
function generateSecurityKeys() {
    return {
        AUTH_KEY: uuidv4(),
        SECURE_AUTH_KEY: uuidv4(),
        LOGGED_IN_KEY: uuidv4(),
        NONCE_KEY: uuidv4(),
        AUTH_SALT: uuidv4(),
        SECURE_AUTH_SALT: uuidv4(),
        LOGGED_IN_SALT: uuidv4(),
        NONCE_SALT: uuidv4(),
        APP_SECRET: uuidv4(),
        CADDY_MERCURE_JWT_SECRET: uuidv4()
    };
}

// Contenu du fichier .env spécifique à chaque environnement
const envTemplates = {
    racine: `
${commonVariables}
ADMINER_DOCKER_PORT=8080
ADMINER_LOCALHOST_PORT=5088
###< PORTS ###

###> FOLDERS ###
FOLDER_BACK=${folderServeurBack}
FOLDER_DATA=${folderDatabase}
FOLDER_DATASQL=\${FOLDER_DATA}/sql
FOLDER_DATABASE=\${FOLDER_DATA}/\${NAME_BDD}
###< FOLDERS ###

`,

    symfony: (securityKeys: Record<string, string>) => `
${commonVariables}
HTTP_LOCALHOST_PORT=${port_symfony}
###< PORTS ###

###> symfony/docker ###
APP_ENV=dev
APP_SECRET='${securityKeys.APP_SECRET}'
###< symfony/docker ###

###> doctrine/doctrine-bundle ###
# Format described at https://www.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/configuration.html#connecting-using-a-url
# IMPORTANT: You MUST configure your server version, either here or in config/packages/doctrine.yaml
## SERVER_NAME="\${SERVER_NAME:-localhost}:\${HTTP_LOCALHOST_PORT:-80}, php:\${HTTP_LOCALHOST_PORT}"
## MERCURE_PUBLISHER_JWT_KEY=\${CADDY_MERCURE_JWT_SECRET:-${securityKeys.CADDY_MERCURE_JWT_SECRET}}
## MERCURE_SUBSCRIBER_JWT_KEY=\${CADDY_MERCURE_JWT_SECRET:-${securityKeys.CADDY_MERCURE_JWT_SECRET}}
## TRUSTED_PROXIES=\${TRUSTED_PROXIES:-127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16}
## TRUSTED_HOSTS=^\${SERVER_NAME:-example\\.com|localhost}|php\$$
# Run "composer require symfony/mercure-bundle" to install and configure the Mercure integration
# MERCURE_URL=\${CADDY_MERCURE_URL:-http://php/.well-known/mercure}
# MERCURE_PUBLIC_URL=http://\${SERVER_NAME:-localhost}:\${HTTP_LOCALHOST_PORT:-443}/.well-known/mercure
# MERCURE_JWT_SECRET=\${CADDY_MERCURE_JWT_SECRET:-${securityKeys.CADDY_MERCURE_JWT_SECRET}}
# The two next lines can be removed after initial installation
## SYMFONY_VERSION=\${SYMFONY_VERSION:-7.0}
## STABILITY=\${STABILITY:-stable}
#
# Format described at https://www.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/configuration.html#connecting-using-a-url
# IMPORTANT: You MUST configure your server version, either here or in config/packages/doctrine.yaml
#
# DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
# DATABASE_URL="mysql://app:!ChangeMe!@127.0.0.1:3306/app?serverVersion=8.0.32&charset=utf8mb4"
# DATABASE_URL="mysql://app:!ChangeMe!@127.0.0.1:3306/app?serverVersion=10.11.2-MariaDB&charset=utf8mb4"
# DATABASE_URL="postgresql://app:!ChangeMe!@127.0.0.1:5432/app?serverVersion=16&charset=utf8"
DATABASE_URL="mysql://\${MYSQL_USER_API}:\${MYSQL_PASSWORD_API}@\${DB_HOST}:\${SQL_LOCALHOST_PORT}/\${MYSQL_DATABASE}?serverVersion=\${MARIADB_VERSION}-MariaDB&charset=utf8mb4"
###< doctrine/doctrine-bundle ###


###> symfony/messenger ###
# Choose one of the transports below
# MESSENGER_TRANSPORT_DSN=amqp://guest:guest@localhost:5672/%2f/messages
# MESSENGER_TRANSPORT_DSN=redis://localhost:6379/messages
MESSENGER_TRANSPORT_DSN=doctrine://default?auto_setup=0
###< symfony/messenger ###

###> symfony/mailer ###
# MAILER_DSN=null://null
###< symfony/mailer ###

`,

    wordpress: (securityKeys: Record<string, string>) => `
${commonVariables}
HTTP_LOCALHOST_PORT=${PORT_BACKEND}
###< PORTS ###

DB_NAME=\${NAME}
DB_USER=\${MYSQL_USER}
DB_PASSWORD=\${MYSQL_PASSWORD}



DB_HOST='localhost'
DB_PREFIX='wp_'
WP_ENV='development'
WP_HOME="http://\${DB_HOST}:\${HTTP_LOCALHOST_PORT}"
WP_SITEURL="\${WP_HOME}/wp"

WP_DEBUG_LOG='/journal/debug.log'

DATABASE_URL="mysql://\${MYSQL_USER}:\${MYSQL_PASSWORD}@\${DB_HOST}:\${SQL_LOCALHOST_PORT}/\${MYSQL_DATABASE}?serverVersion=\${MARIADB_VERSION}-MariaDB&charset=utf8mb4"

AUTH_KEY='${securityKeys.AUTH_KEY}'
SECURE_AUTH_KEY='${securityKeys.SECURE_AUTH_KEY}'
LOGGED_IN_KEY='${securityKeys.LOGGED_IN_KEY}'
NONCE_KEY='${securityKeys.NONCE_KEY}'
AUTH_SALT='${securityKeys.AUTH_SALT}'
SECURE_AUTH_SALT='${securityKeys.SECURE_AUTH_SALT}'
LOGGED_IN_SALT='${securityKeys.LOGGED_IN_SALT}'
NONCE_SALT='${securityKeys.NONCE_SALT}'
`
};

// Fonction pour générer le fichier .env
export function createEnvBase(fileType: 'data' | 'symfony' | 'wordpress') {
    const securityKeys = generateSecurityKeys();

    let envContent = fileType === 'wordpress'
        ? envTemplates.wordpress(securityKeys)
        : fileType === 'symfony'
            ? envTemplates.symfony(securityKeys)
            : envTemplates.racine;

    const targetFolder = fileType === 'wordpress'
        ? FOLDER_REL_SERVER_BACK
        : fileType === 'symfony'
            ? FOLDER_REL_SERVER_FRONT
            : FOLDER_REL_BASE;

    createFiles(targetFolder, '.env', envContent);
}
