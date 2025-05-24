import fs from 'fs';
import { runCommand } from "./command";
import { FOLDER_REL_SERVER_FRONT } from './variables';


/**
 * Installe SCSS et TypeScript en ajustant les fichiers et configurations nécessaires.
 */
export async function installScssTs(): Promise<void> {
    process.chdir(FOLDER_REL_SERVER_FRONT);

    // Chemins des fichiers
    const appJsPath: string = 'assets/app.js';
    const appTsPath: string = 'assets/app.ts';
    const appCssPath: string = 'assets/styles/app.css';
    const appScssPath: string = 'assets/styles/app.scss';

    // === 🛠️ Mise à jour de app.js ===
    if (fs.existsSync(appJsPath)) {
        const appJsContent: string = fs.readFileSync(appJsPath, 'utf8');
        const updatedContent: string = appJsContent.replace(
            /import\s+['"]\.\/styles\/app\.css['"];/,
            `import './styles/app.scss';`
        );
        fs.writeFileSync(appJsPath, updatedContent, 'utf8');
        console.log(`✅ Le fichier ${appJsPath} a été mis à jour : 'app.css' remplacé par 'app.scss'.`);
    } else {
        console.warn(`⚠️ Le fichier ${appJsPath} n'existe pas. Aucune modification appliquée.`);
    }

    console.log('🚀 Mise à jour terminée avec succès !');

    // === 🛠️ Renommer le fichier app.js en app.ts ===
    if (fs.existsSync(appJsPath)) {
        fs.renameSync(appJsPath, appTsPath);
        console.log(`✅ Le fichier a été renommé : ${appJsPath} → ${appTsPath}`);
    } else {
        console.warn(`⚠️ Le fichier ${appJsPath} n'existe pas. Aucune action effectuée.`);
    }

    // === 🛠️ Renommer le fichier app.css en app.scss ===
    if (fs.existsSync(appCssPath)) {
        fs.renameSync(appCssPath, appScssPath);
        console.log(`✅ Le fichier a été renommé : ${appCssPath} → ${appScssPath}`);
    } else {
        console.warn(`⚠️ Le fichier ${appCssPath} n'existe pas. Aucune action effectuée.`);
    }

    // === 🛠️ Mettre à jour les références dans les autres fichiers ===
    function updateReferencesInFile(filePath: string, searchValue: string, replaceValue: string): void {
        if (fs.existsSync(filePath)) {
            const content: string = fs.readFileSync(filePath, 'utf8');
            const updatedContent: string = content.replace(new RegExp(searchValue, 'g'), replaceValue);
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ Référence mise à jour dans ${filePath}`);
        }
    }

    const filesToUpdate: string[] = ['importmap.php'];
    filesToUpdate.forEach(file => {
        updateReferencesInFile(file, 'app.js', 'app.ts');
    });

    console.log('🚀 Renommage et mise à jour des références terminés avec succès !');

    runCommand(`php bin/console sass:build --watch`);
    runCommand(`php bin/console typescript:build --watch`);
    runCommand(`php bin/console asset-map:compile`);
}
