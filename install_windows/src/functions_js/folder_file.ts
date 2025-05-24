import * as fs from 'fs';

export const createDirectoryIfNotExists = async (directoryPath: string): Promise<void> => {
    try {
        await fs.promises.access(directoryPath, fs.constants.F_OK);
        const stats = await fs.promises.stat(directoryPath);
        if (stats.isDirectory()) {
            // console.log(`Le dossier '${directoryPath}' existe déjà.`);
        } else {
            console.log(`Le chemin '${directoryPath}' existe mais ce n'est pas un dossier.`);
        }
    } catch {
        console.log(`Le dossier '${directoryPath}' n'existe pas, création en cours...`);
        await fs.promises.mkdir(directoryPath, { recursive: true });
        console.log(`Dossier '${directoryPath}' créé avec succès.`);
    }
};


export async function createFiles(folder: string, filePath: string, content: string) {
    await createDirectoryIfNotExists(folder);
    // Écriture du fichier .env
    fs.writeFileSync(folder + "\\" + filePath, content, 'utf8');
    console.log(`Fichier ${filePath} généré avec succès.`);
}