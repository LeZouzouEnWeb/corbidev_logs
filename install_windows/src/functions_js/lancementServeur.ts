import { openTerminal } from './command';
import { FOLDER_REL_SERVER_BACK, FOLDER_REL_SERVER_FRONT } from './variables';
import open from 'open';
import http from 'http';


/**
 * Lance le serveur en fonction de la plateforme spécifiée.
 *
 * @param {string} serveur - Le type de serveur à lancer : "front" pour le serveur frontend ou autre pour le backend.
 * @param {number} [port=8000] - Le port sur lequel le serveur sera lancé (par défaut 8000).
 *
 * @returns {Promise<void>} Une promesse qui se résout lorsque la commande est exécutée et que la page est ouverte dans le navigateur.
 */

export async function lancementServeur(serveur: string, port: number = 8000): Promise<void> {
    const PORT_SERVEUR: number = await findAvailablePort(port);
    if (serveur === "front") {
        // Changer le répertoire de travail vers le dossier du serveur frontend
        process.chdir(FOLDER_REL_SERVER_FRONT);
        // Ouvrir un nouveau terminal pour démarrer le serveur Symfony
        openTerminal(`symfony server:start --port=${PORT_SERVEUR}`);
    } else {
        // Changer le répertoire de travail vers le dossier du serveur backend
        process.chdir(FOLDER_REL_SERVER_BACK);
        // Ouvrir un nouveau terminal pour démarrer un serveur PHP
        openTerminal(`php -S localhost:${PORT_SERVEUR} -t web`);
        // runCommand('php -S localhost:8088 -t public');
    }

    // Importer le module open et ouvrir l'URL dans le navigateur
    await open(`http://localhost:${PORT_SERVEUR}`);
}


// Fonction utilitaire pour tester si un port est libre
async function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const tester = http.createServer()
            .once('error', () => resolve(false))
            .once('listening', () => tester.close(() => resolve(true)))
            .listen(port);
    });
}

// Fonction pour trouver un port libre à partir d'un point de départ
export async function findAvailablePort(startPort: number): Promise<number> {
    let port = startPort;
    while (!(await isPortAvailable(port))) {
        console.log(`⚠️ Port ${port} occupé. Test du suivant...`);
        port++;
    }
    console.log(`✅ Port ${port} libre.`);
    return port;
}

