<?php
declare(strict_types=1);

/**
 * Cron — Purge par rétention.
 *
 * Lit la table `retention(id_app, niveau, nb_jours)` et supprime les lignes trop anciennes
 * dans `evenement_log`, via jointure sur `app_env(id_app_env)->application(id_app)`.
 * Suppression par lots (LIMIT) pour éviter les verrous longs.
 *
 * Config via variables d'environnement :
 *   LOGS_DB_DSN, LOGS_DB_USER, LOGS_DB_PASS
 *   LOGS_BATCH_DELETE (optionnel, défaut 20000)
 *
 * Droits SQL requis :
 *   - SELECT, DELETE sur le schéma
 */

const TBL = 'evenement_log';

function env(string $key, ?string $default = null): ?string {
    $v = getenv($key);
    return $v === false ? $default : $v;
}

function pdo(): PDO {
    $dsn  = env('LOGS_DB_DSN') ?: die("[ERR] LOGS_DB_DSN absent\n");
    $user = env('LOGS_DB_USER') ?: die("[ERR] LOGS_DB_USER absent\n");
    $pass = env('LOGS_DB_PASS') ?: die("[ERR] LOGS_DB_PASS absent\n");
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}

function fetchRetentions(PDO $pdo): array {
    $sql = "SELECT id_app, niveau, nb_jours FROM retention";
    return $pdo->query($sql)->fetchAll();
}

function purgeRule(PDO $pdo, int $idApp, string $niveau, int $nbJours, int $batch): int {
    $total = 0;
    do {
        $sql = "
            DELETE e
            FROM evenement_log e
            JOIN app_env ae ON ae.id_app_env = e.id_app_env
            WHERE ae.id_app = :idApp
              AND e.niveau = :niv
              AND e.event_ts < (NOW(3) - INTERVAL :nb DAY)
            LIMIT :lim
        ";
        $st = $pdo->prepare($sql);
        // ATTENTION: LIMIT ne supporte pas les paramètres nommés sans bindValue(PDO::PARAM_INT)
        $st->bindValue(':idApp', $idApp, PDO::PARAM_INT);
        $st->bindValue(':niv', $niveau, PDO::PARAM_STR);
        $st->bindValue(':nb', $nbJours, PDO::PARAM_INT);
        $st->bindValue(':lim', $batch, PDO::PARAM_INT);
        $st->execute();
        $aff = $st->rowCount();
        $total += $aff;
        if ($aff > 0) {
            echo sprintf("[RULE] app=%d niveau=%s nb_jours=%d -> -%d\n", $idApp, $niveau, $nbJours, $aff);
        }
        // Boucle jusqu'à épuisement
    } while ($aff === $batch);
    return $total;
}

try {
    $pdo = pdo();
    $batch = (int)(env('LOGS_BATCH_DELETE') ?? '20000');
    $rules = fetchRetentions($pdo);
    if (!$rules) {
        echo "[INFO] Aucune règle de rétention définie.\n";
        exit(0);
    }
    $grandTotal = 0;
    foreach ($rules as $r) {
        $grandTotal += purgeRule($pdo, (int)$r['id_app'], (string)$r['niveau'], (int)$r['nb_jours'], $batch);
    }
    echo "[DONE] Purge terminée. Total supprimé = {$grandTotal}.\n";
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, "[ERR] ".$e->getMessage()."\n");
    exit(1);
}
