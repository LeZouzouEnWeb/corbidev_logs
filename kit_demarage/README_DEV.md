# 📌 Instructions de développement — Projet Rapport/Trajet

## 🔹 Transmission des fichiers

- Toujours **transmettre les fichiers en `.zip`**.
- ⚠️ Ne jamais fournir de **patch** ou de diff : toujours les **fichiers complets modifiés**.
- **Attention aux régressions** : tester avant envoi.
- Lorsque je t’envoie un `.zip`, **reprendre l’intégralité de son contenu** comme nouvelle base de travail.

## 🔹 Conventions de travail

- On ne travaille **que sur le dossier `dev/`**.
- On ne travaille **que sur un fichier à la fois**, sauf demande explicite.
- Chaque fonction doit comporter **un commentaire PHPDoc** décrivant :
  - Son rôle
  - Ses paramètres
  - Son retour

## 🔹 Conformité **SonarQube**

Un **pass SonarQube ciblé** doit être appliqué sur les fichiers modifiés :

- Réduction de la **complexité cognitive**
- Élimination des **duplications**
- Sécurisation (**XSS**, **SQL**)
- Utilisation de **constantes**
- Application de l’**early return**

### ✅ Règles spécifiques

- **S121 – accolades obligatoires**Tous les `if` / `continue` / `return` en une seule ligne doivent être entourés d’accolades `{ }`.
- **S100 – renommage de fonction**

  - `__mask_value` ➜ `maskValue` (camelCase conforme à `^[a-z][a-zA-Z0-9]*$`)
  - Tous les appels mis à jour (ex. dans `__mask_recursive`).
- **S1142 – trop de return**

  - `maskValue()` refactorée à **2 retours maximum (≤ 3)**.
- **S3776 – complexité cognitive**

  - `maskValue()` découpée en **helpers** :
    - `normalizeKey()`
    - `containsSensitiveKeyFragment()`
    - `looksLikeCredentialInContent()`
    - `looksLikeSensitiveProtocol()`
    - `looksLikeHttpUrl()`
    - `maskFilesystemPathIfAny()`
- **sonarqube(php:S3358)** appliqué.

## 🔹 Rétrocompatibilité

- Si une fonction est remplacée :
  - L’ancienne doit être **gardée en mode `@deprecated`**
  - Documenter la nouvelle fonction
  - ⚠️ Les appels existants continuent de fonctionner.

## 🔹 Sécurité & constantes

- Remplacer :

  ```php
  define('CORB_START', "start");
  ```
  par

  ```php
  define('API_GATEWAY', true);
  ```
- Remplacer :

  ```php
  if (!defined('CORB_START')) {
  }
  ```
  par

  ```php
  if (!defined('API_GATEWAY')) {
      http_response_code(403);
      exit("❌ accès refusé");
  }
  ```
