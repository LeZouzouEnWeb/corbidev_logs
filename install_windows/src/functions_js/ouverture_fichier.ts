import { exec, spawn } from 'child_process';
import notifier from 'node-notifier';
import open from 'open';
import fs from 'fs';

// Interface pour les options du logiciel
interface SoftwareOptions {
    name: string;               // Nom du logiciel (ex: Docker Desktop)
    executableName: string;     // Nom du processus (ex: Docker Desktop.exe)
    executablePath: string;     // Chemin du fichier exécutable
    downloadUrl: string;        // URL de téléchargement
    readyCommand?: string;      // Commande pour vérifier si le logiciel est prêt
}

export class SoftwareManager {
    private name: string;
    private executableName: string;
    private executablePath: string;
    private downloadUrl: string;
    private readyCommand: string | undefined;

    constructor(options: SoftwareOptions) {
        this.name = options.name;
        this.executableName = options.executableName;
        this.executablePath = options.executablePath;
        this.downloadUrl = options.downloadUrl;
        this.readyCommand = options.readyCommand;
    }

    // Vérifier si le logiciel est lancé
    async isRunning(): Promise<boolean> {
        return new Promise((resolve) => {
            exec(`tasklist | findstr /i "${this.executableName}"`, (err) => {
                resolve(!err);
            });
        });
    }

    // Vérifier si le logiciel est installé
    isInstalled(): boolean {
        return fs.existsSync(this.executablePath);
    }

    // Lancer le logiciel
    launch(): void {
        console.log(`Lancement de ${this.name}...`);
        spawn(this.executablePath, { detached: true, stdio: 'ignore' }).unref();
    }

    // Attendre que le logiciel soit complètement lancé
    async waitForReady(): Promise<void> {
        if (!this.readyCommand) {
            console.log(`Aucune commande de vérification fournie pour ${this.name}.`);
            return;
        }

        console.log(`En attente du lancement complet de ${this.name}...`);
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                exec(this.readyCommand!, (err) => {
                    if (!err) {
                        clearInterval(interval);
                        console.log(`${this.name} est maintenant prêt.`);
                        resolve();
                    } else {
                        console.log(`En attente de ${this.name}...`);
                    }
                });
            }, 5000);
        });
    }

    // Proposer le téléchargement si le logiciel n'est pas installé
    async promptForInstallation(): Promise<void> {
        console.log(`${this.name} n'est pas installé.`);
        notifier.notify(
            {
                title: `${this.name} Manquant`,
                message: `${this.name} n'est pas installé. Voulez-vous le télécharger ?`,
                wait: true,
                actions: ['Télécharger', 'Annuler']
            },
            async (err: Error | null, response: string, metadata: any) => {
                if (metadata?.activationValue === 'Télécharger') {
                    console.log(`Ouverture du navigateur pour télécharger ${this.name}...`);
                    await open(this.downloadUrl);
                } else {
                    console.log('Installation annulée.');
                    process.exit(0);
                }
            }
        );
    }

    // Processus complet de vérification et de lancement
    async run(): Promise<void> {
        if (await this.isRunning()) {
            console.log(`${this.name} est déjà lancé.`);
        } else {
            console.log(`${this.name} n'est pas lancé.`);

            if (this.isInstalled()) {
                console.log(`${this.name} est installé.`);
                this.launch();
                if (this.readyCommand) {
                    await this.waitForReady();
                }
            } else {
                await this.promptForInstallation();
            }
        }

        console.log('Suite du processus...');
        // Ajoutez ici les commandes à exécuter après le démarrage du logiciel.
    }
}
