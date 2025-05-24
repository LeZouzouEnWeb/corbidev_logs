import path from "path";
import fs from "fs";

/**
 * Vide un dossier tout en conservant certains fichiers/dossiers.
 * @param folderPath - Chemin du dossier à nettoyer.
 * @param keepList - Liste des fichiers/dossiers à conserver.
 */
export function cleanFolder(folderPath: string, keepList: string[]): void {
    if (!fs.existsSync(folderPath)) {
        console.warn(`⚠️ Le dossier "${folderPath}" n'existe pas.`);
        return;
    }

    fs.readdirSync(folderPath).forEach(item => {
        const itemPath = path.join(folderPath, item);
        const isDirectory = fs.statSync(itemPath).isDirectory();

        if (!keepList.includes(item)) {
            if (isDirectory) {
                fs.rmSync(itemPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(itemPath);
            }
            console.log(`🗑️ Supprimé : ${itemPath}`);
        }
    });
}

/**
 * Renomme un dossier.
 * @param oldPath - Chemin actuel du dossier.
 * @param newPath - Nouveau chemin du dossier.
 */
export function renameFolder(oldPath: string, newPath: string): void {
    if (fs.existsSync(newPath)) {
        fs.rmSync(newPath, { recursive: true, force: true });
        console.log(`🔄 Dossier existant supprimé : ${newPath}`);
    }

    fs.renameSync(oldPath, newPath);
    console.log(`📁 Dossier renommé de "${oldPath}" à "${newPath}"`);
}

/**
 * Copie le contenu d'un dossier vers un autre.
 * @param src - Chemin source du dossier.
 * @param dest - Chemin de destination du dossier.
 */
export function copyFolderContent(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    fs.readdirSync(src).forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (fs.statSync(srcPath).isDirectory()) {
            copyFolderContent(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
        console.log(`📦 Copié : ${srcPath} → ${destPath}`);
    });
}
