import { exec, execSync, spawn } from "child_process";
import { Server } from 'socket.io';

/**
 * Exécute une commande avec diffusion des logs en temps réel via Socket.IO et attend sa fin.
 * @param command - La commande à exécuter.
 * @param args - Les arguments de la commande.
 * @param io - Instance de Socket.IO pour envoyer les logs.
 * @returns Une promesse résolue lorsque la commande est terminée.
 */
export function runCommandWithLogs(command: string, args: string[], io: Server): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`Exécution (séquentielle) : ${command} ${args.join(' ')}`);

        const process = spawn(command, args, { shell: true });

        process.stdout.on('data', (data) => {
            const message = `[stdout] ${data.toString()}`;
            console.log(message);
            io.emit('consoleMessage', message);
        });

        process.stderr.on('data', (data) => {
            const message = `[stderr] ${data.toString()}`;
            console.error(message);
            io.emit('consoleMessage', message);
        });

        process.on('close', (code) => {
            const message = `Process terminé avec le code ${code}`;
            console.log(message);
            io.emit('consoleMessage', message);

            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Commande échouée avec le code ${code}`));
            }
        });

        process.on('error', (error) => {
            reject(error);
        });
    });
}


/**
 * Exécute une commande de manière synchrone.
 * @param command - La commande à exécuter.
 * @param options - Options supplémentaires pour l'exécution.
 */
export function runCommand(command: string, options: object = {}): void {
    try {
        console.log(`Exécution : ${command}`);
        execSync(command, { stdio: "inherit", ...options });
    } catch (error: any) {
        console.error(`Erreur lors de l'exécution : ${error.message}`);
        process.exit(1);
    }
}

/**
 * Exécute une commande de manière asynchrone.
 * @param command - La commande à exécuter.
 * @param callback - Fonction de rappel avec le résultat ou une erreur.
 */
export function executeCommand(command: string, callback: (output: string) => void): void {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            callback(`Erreur: ${stderr}`);
        } else {
            callback(stdout);
        }
    });
}

/**
 * Ouvre un terminal et exécute une commande en fonction du système d'exploitation.
 * @param command - La commande à exécuter dans le terminal.
 */
export function openTerminal(command: string): void {
    const platform: NodeJS.Platform = process.platform;

    if (platform === "win32") {
        // Windows (CMD)
        spawn("cmd.exe", ["/c", `start cmd.exe /k "${command}"`], { shell: true });

    } else if (platform === "darwin") {
        // macOS (Terminal)
        spawn("osascript", [
            "-e",
            `tell application "Terminal" to do script "${command}"`
        ]);
    } else if (platform === "linux") {
        // Linux (GNOME Terminal)
        spawn("gnome-terminal", ["--", "bash", "-c", command]);
    } else {
        console.error("Système d'exploitation non supporté");
    }
}
