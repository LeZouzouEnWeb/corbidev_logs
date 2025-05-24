# INSTALLATION

## FRONT / SYNFONY

* version 7.1.*
```bash
    composer create-project symfony/skeleton:7.1.* serveur_front
    composer require webapp
    composer require sensiolabs/typescript-bundle
    composer require symfonycasts/sass-bundle
```

* Une fois typescript installé :
    1. créer le dossier 'serveur_front\assets\typescript'
    2. créer le fichier 'serveur_front\assets\typescript\app.ts'
    3. suivre cette procédure : [AssetMapperTypeScriptBundle](https://symfony.com/bundles/AssetMapperTypeScriptBundle/current/index.html)

* Une fois sass installé :
    1. renommer le fichier 'serveur_front\assets\style\app.css' en 'app.scss'
    2. suivre cette procédure : [SassBundle](https://symfony.com/bundles/SassBundle/current/index.html)

* Installer Bootstrap et Bootswatch

```bash
composer require twbs/bootstrap
composer require thomaspark/bootswatch
```

* Insérer ceci dans styles.scss :

```css
@import '../../vendor/thomaspark/bootswatch/dist/[theme]/variables';
@import '../../vendor/twbs/bootstrap/scss/bootstrap';
@import '../../vendor/thomaspark/bootswatch/dist/[theme]/bootswatch';
```

## SERVEUR BACKEND WORDPRESS

```bash
composer create-project roots/bedrock serveur_back
```
# corbidev_install
