import path from "path";
import { runCommandWithLogs } from "./command";
import { cleanFolder, copyFolderContent, renameFolder } from "./folders";
import { BACKUP_FOLDER_BACK, FOLDER_REL_BASE, FOLDER_REL_SERVER_BACK, FOLDER_SERVER_BACK } from "./variables";
import { Server } from 'socket.io';
import express, { Express } from 'express';
import fs from 'fs';
import http from 'http';

const app: Express = express();
const server: http.Server = http.createServer(app);
const io = new Server(server);
/**
 * Installe WordPress en utilisant Bedrock.
 */

export async function installWordpress(): Promise<void> {
    console.log('Installation de WordPress');

    if (fs.existsSync(FOLDER_REL_SERVER_BACK)) {
        try {
            // 1. Vider le dossier en conservant certains fichiers/dossiers
            cleanFolder(FOLDER_REL_SERVER_BACK, ['.git', '.vscode', '.github']);

            // 2. Renommer le dossier
            renameFolder(FOLDER_REL_SERVER_BACK, BACKUP_FOLDER_BACK);

            console.log('✅ Opérations terminées avec succès.');
        } catch (err) {
            console.error('❌ Une erreur est survenue :', err);
        }
    }

    if (!fs.existsSync(FOLDER_REL_SERVER_BACK)) {
        fs.mkdirSync(FOLDER_REL_SERVER_BACK, { recursive: true });
    }

    process.chdir(FOLDER_REL_BASE);

    // 3. Créer un projet WordPress avec Composer
    await runCommandWithLogs(`composer create-project`, [`roots/bedrock`, ` ${FOLDER_SERVER_BACK}`], io);

    // 4. Copier le contenu du dossier de sauvegarde
    if (fs.existsSync(BACKUP_FOLDER_BACK)) {
        copyFolderContent(BACKUP_FOLDER_BACK, FOLDER_REL_SERVER_BACK);
        fs.rmdirSync(path.join(BACKUP_FOLDER_BACK), { recursive: true });
    }

    process.chdir(FOLDER_REL_SERVER_BACK);
}
