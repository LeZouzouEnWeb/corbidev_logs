import path from "path";
import config from  "../instal_config.json";
/**
 * Le port sur lequel le serveur doit écouter.
 * @constant
 * @type {number}
 */
export const PORT_INSTALL: number = config.port.install ?? 3000;
export const PORT_BACKEND: number = config.port.backend ?? 9000;
export const PORT_FRONTEND: number = config.port.frontend ?? 8080;



// Variables globales
/**
 * Nom du dossier du serveur frontend.
 * @constant
 * @type {string}
 */
export const FOLDER_DATA_BASE: string = config.name.database ?? "database";


/**
 * Chemin relatif vers la racine du serveur. Si la variable d'environnement 'folder_rel_serveur' est définie, elle est utilisée, sinon un chemin par défaut est généré.
 * @constant
 * @type {string}
 */
export const FOLDER_REL_BASE: string = process.env.folder_rel_serveur || path.join(__dirname, '..', '..', '..');

/**
 * Nom du dossier du serveur frontend.
 * @constant
 * @type {string}
 */
export const FOLDER_SERVER_FRONT: string = config.name.dossier_front ?? "serveur-frontend";

/**
 * Chemin relatif vers le dossier du serveur frontend. Si la variable d'environnement 'folder_rel_serveur' est définie, elle est utilisée, sinon un chemin par défaut est généré.
 * @constant
 * @type {string}
 */
export const FOLDER_REL_SERVER_FRONT: string = process.env.folder_rel_serveur || path.join(FOLDER_REL_BASE, FOLDER_SERVER_FRONT);

/**
 * Dossier de sauvegarde pour le serveur frontend.
 * @constant
 * @type {string}
 */
export const BACKUP_FOLDER: string = FOLDER_REL_SERVER_FRONT + '_backup';

/**
 * Nom du dossier du serveur backend.
 * @constant
 * @type {string}
 */
export const FOLDER_SERVER_BACK: string = config.name.dossier_back ?? "serveur-backend";

/**
 * Chemin relatif vers le dossier du serveur backend. Si la variable d'environnement 'folder_rel_serveur' est définie, elle est utilisée, sinon un chemin par défaut est généré.
 * @constant
 * @type {string}
 */
export const FOLDER_REL_SERVER_BACK: string = process.env.folder_rel_serveur || path.join(FOLDER_REL_BASE, FOLDER_SERVER_BACK);

/**
 * Dossier de sauvegarde pour le serveur backend.
 * @constant
 * @type {string}
 */
export const BACKUP_FOLDER_BACK: string = FOLDER_REL_SERVER_BACK + '_backup';

/**
 * Chemin relatif vers le dossier de la base de données. Si la variable d'environnement 'folder_rel_data' est définie, elle est utilisée, sinon un chemin par défaut est généré.
 * @constant
 * @type {string}
 */
export const FOLDER_REL_DATA: string = process.env.folder_rel_data || path.join(FOLDER_REL_BASE, FOLDER_DATA_BASE);

/**
 * Version de Node.js à utiliser.
 * @constant
 * @type {string}
 */
export const VERSION_NODE_JS: string = config.version.nodejs;

/**
 * Version de Symfony à utiliser.
 * @constant
 * @type {string}
 */
export const VERSION_SYMFONY: string = config.version.symfony;

/**
 * Chemin vers le dossier contenant le layout d'installation.
 * @constant
 * @type {string}
 */
// export const layout: string = path.join(__dirname, 'install');

export const BDD = {
    name: config.name.project ?? "mon_projet",
    basedb: 'mariadb',
    version_default: '1.0.0',
    version_mariadb: config.version.mariadb ?? "10.6",
    version_adminer: config.version.adminer ?? "4.8.1",
    folderDatabase: FOLDER_DATA_BASE,
    folderServeurBack: FOLDER_SERVER_BACK,
    port_symfony: PORT_FRONTEND
};
