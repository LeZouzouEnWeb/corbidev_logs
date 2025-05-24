import { SoftwareManager } from './ouverture_fichier';
import { FOLDER_REL_BASE } from './variables';
import { createFiles } from './folder_file';


// Variables d'environnement (à définir dans le fichier .env ou directement dans le shell)
const {
    NAME,
    ADMINER_VERSION,
    ADMINER_LOCALHOST_PORT,
    ADMINER_DOCKER_PORT,
    MARIADB_VERSION,
    SQL_LOCALHOST_PORT,
    SQL_DOCKER_PORT,
    FOLDER_DATASQL,
    FOLDER_DATABASE
} = process.env;

// Contenu du fichier docker-compose.yml
const dockerComposeContent = `
services:
# ##> BASE DE DONNÉES // ADMINER ET mariadb
    adminer:
        platform: linux/x86_64
        container_name: adminer_\${NAME}_\${ADMINER_VERSION}
        image: adminer:\${ADMINER_VERSION}
        restart: unless-stopped
        ports:
            - \${ADMINER_LOCALHOST_PORT}:\${ADMINER_DOCKER_PORT}
        env_file:
            - .env
        depends_on:
            - database

###> doctrine/doctrine-bundle ###
    database:
        platform: linux/x86_64
        container_name: mariadb_\${NAME}_\${MARIADB_VERSION}
        image: mariadb:\${MARIADB_VERSION}
        restart: unless-stopped
        env_file:
            - .env
        volumes:
            - ../\${FOLDER_DATASQL}:/docker-entrypoint-initdb.d/
            - ../\${FOLDER_DATABASE}:/var/lib/mysql:rw
        ports:
            - \${SQL_LOCALHOST_PORT}:\${SQL_DOCKER_PORT}
###< doctrine/doctrine-bundle ###

# ##< BASE DE DONNÉES // ADMINER ET mariadb

volumes:
###> doctrine/doctrine-bundle ###
    database:
###< doctrine/doctrine-bundle ###
`;

export function createDockerCompose() {
    // Écriture du fichier
    createFiles(FOLDER_REL_BASE, 'docker-compose.yml', dockerComposeContent);
}

export const dockerManager = new SoftwareManager({
    name: 'Docker Desktop',
    executableName: 'Docker Desktop.exe',
    executablePath: 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
    downloadUrl: 'https://www.docker.com/products/docker-desktop/',
    readyCommand: 'docker info'
});