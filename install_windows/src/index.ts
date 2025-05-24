import express, { Request, Response } from 'express';
import http from 'http';
import { installSymfony } from './functions_js/symfony';
import open from 'open';
import { installWordpress } from './functions_js/wordpress';
import { installScssTs } from './functions_js/installScssTs';
import { findAvailablePort, lancementServeur } from './functions_js/lancementServeur';
import { FOLDER_REL_BASE, PORT_INSTALL, PORT_BACKEND, PORT_FRONTEND } from './functions_js/variables';
import { createEnvBase } from './functions_js/file_env';
import { Server } from 'socket.io';
import { createDockerCompose, dockerManager } from './functions_js/docker';
import { runCommandWithLogs } from './functions_js/command';

// Initialisation de l'application Express et du serveur HTTP
const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server);

// Rediriger console.log vers Socket.IO et la console
const originalConsoleLog = console.log;

console.log = (...args) => {

    const timestamp = new Date().toLocaleTimeString(); // Obtient l'heure au format HH:mm:ss
    const logMessage = `[${timestamp}] ${args.join(' ')}`; // Ajoute l'heure au début du message

    originalConsoleLog(logMessage); // Affiche toujours dans la console du serveur
    io.emit('consoleMessage', logMessage); // Envoie au client via Socket.IO
};

// Écouter les connexions socket
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');
    socket.on('disconnect', () => {
        console.log('Un utilisateur est déconnecté');
    });
});

/**
 * Route pour exécuter une action donnée.
 * @param {string} action - L'action à exécuter (par exemple, 'C', 'R', 'I', etc.).
 * @returns {Promise<void>} - Une promesse qui se résout lorsque la commande est exécutée.
 */
app.get('/run-action/:action', async (req: Request, res: Response): Promise<void> => {
    const action = req.params.action;

    let command = 'Lancement de : ';
    try {
        switch (action) {
            case 'IS':
                console.log('Installation complète de Symfony');
                await installSymfony();
                await installScssTs();
                break;
            case 'TS':
                console.log('Installation SCSS et TS pour Symfony');
                await installScssTs();
                break;
            case 'SE':
                console.log('Créer le .env de Symfony');
                createEnvBase('symfony');
                break;


            case 'WP':
                console.log('Installation complète de WordPress');
                await installWordpress();
                break;
            case 'WE':
                console.log('Créer le .env de WordPress');
                createEnvBase('wordpress');
                break;

            case 'DKEN':
                console.log('Créer le .env de Docker');
                createEnvBase('data');
                break;
            case 'DKCP':
                console.log('Installation de docker-compose');
                // createEnvBase('data');
                createDockerCompose();
                await dockerManager.run().catch((err: any) => console.error(err));
                process.chdir(FOLDER_REL_BASE);
                await runCommandWithLogs('docker-compose', ['up', '-d'], io);
                break;
            case 'DKLT':
                console.log('Ouverture de Docker');
                await dockerManager.run().catch((err: any) => console.error(err));
                break;

            case 'LS':
                console.log('Lancement du  serveur Symfony');
                await lancementServeur("front", await PORT_FRONTEND);
                break;
            case 'LW':
                console.log('Lancement du  serveur WordPress');
                await lancementServeur("back", await PORT_BACKEND);
                break;


            case 'Q':
                console.log('Quitter l\'application.');
                shutdown();
                break;
            default:
                command = 'Action inconnue.';
        }
        res.send(`<pre>${command}</pre>`); // Envoie la réponse au client
    } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'action:', error);
        res.status(500).send('Une erreur est survenue.');
    }
});


function shutdown() {
    
    console.log('Arrêt du serveur en cours...');
    // Arrêter le serveur après 10 secondes
    // setTimeout(() => {
        //     server.close(() => {
    //         console.log('Serveur arrêté');
    //     });
    // }, 10000);  // Arrêt après 10 secondes
    setTimeout(() => {
        console.log('');
        console.log('Serveur Stoppé !');
        process.exit();
    }, 1000);  // Arrêt après 10 secondes
}

// Démarre le serveur Express et ouvre automatiquement l'URL dans le navigateur.
// Lancement du serveur
async function start() {
    const PORT_SERVEUR = await findAvailablePort(PORT_INSTALL);

    const server = app.listen(PORT_SERVEUR, async () => {
        console.log(`✅ Server running at http://localhost:${PORT_SERVEUR}`);
        try {
            await open(`http://localhost:${PORT_SERVEUR}`);
        } catch (err) {
            console.error('❌ Failed to open the browser:', err);
        }
    });

    server.on('error', (err) => {
        console.error('Erreur serveur :', err);
    });
}

start();