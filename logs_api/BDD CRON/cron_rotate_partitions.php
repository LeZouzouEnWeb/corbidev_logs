<?php
declare(strict_types=1);

/**
 * Cron — Rotation des partitions mensuelles sur `evenement_log`.
 *
 * - Ajoute la partition du mois suivant si elle n'existe pas
 * - Supprime les partitions antérieures à NOW() - KEEP_MONTHS (DROP PARTITION)
 *
 * Config via variables d'environnement :
 *   LOGS_DB_DSN  (ex: mysql:host=127.0.0.1;port=3306;dbname=logs_core;charset=utf8mb4)
 *   LOGS_DB_USER
 *   LOGS_DB_PASS
 *   LOGS_KEEP_MONTHS (optionnel, défaut 18)
 *
 * Droits SQL requis pour l'utilisateur :
 *   - ALTER, CREATE, DROP sur logs_core.evenement_log
 *   - SELECT sur information_schema.PARTITIONS (implicite)
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

function sqlValue(PDO $pdo, string $sql, array $params = []) {
    $st = $pdo->prepare($sql);
    $st->execute($params);
    return $st->fetchColumn();
}

function addNextMonthPartition(PDO $pdo, string $dbName): void {
    $y = (int)date('Y');
    $m = (int)date('n') + 1;
    if ($m === 13) { $m = 1; $y++; }
    $nextVal = $y*100 + $m;
    $partName = sprintf('p%04d_%02d', $y, $m);

    // Vérifie existence
    $exists = sqlValue($pdo, "
        SELECT 1
        FROM information_schema.PARTITIONS
        WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :tbl AND PARTITION_NAME = :p
    ", [':db'=>$dbName, ':tbl'=>TBL, ':p'=>$partName]);

    if ($exists) {
        echo "[SKIP] Partition déjà présente: {$partName}\n";
        return;
    }

    // Vérifie présence de pmax
    $hasPmax = sqlValue($pdo, "
        SELECT 1
        FROM information_schema.PARTITIONS
        WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :tbl AND PARTITION_NAME = 'pmax'
    ", [':db'=>$dbName, ':tbl'=>TBL]);

    if (!$hasPmax) {
        throw new RuntimeException("La partition pmax est absente — vérifiez la définition de partition.");
    }

    $sql = sprintf(
        'ALTER TABLE %s REORGANIZE PARTITION pmax INTO (PARTITION %s VALUES LESS THAN (%d), PARTITION pmax VALUES LESS THAN MAXVALUE)',
        TBL, $partName, $nextVal
    );
    $pdo->exec($sql);
    echo "[OK] Ajout partition {$partName} (< {$nextVal})\n";
}

function dropOldPartitions(PDO $pdo, string $dbName, int $keepMonths): void {
    // Calcule le cutoff AAAAMM
    $dt = new DateTimeImmutable();
    $cut = $dt->sub(new DateInterval('P' . $keepMonths . 'M'));
    $cutoff = ((int)$cut->format('Y'))*100 + (int)$cut->format('m');

    $sql = "
        SELECT GROUP_CONCAT(PARTITION_NAME ORDER BY PARTITION_DESCRIPTION SEPARATOR ',') AS parts
        FROM information_schema.PARTITIONS
        WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :tbl
          AND PARTITION_NAME REGEXP '^p[0-9]{4}_[0-9]{2}$'
          AND PARTITION_DESCRIPTION < :cutoff
    ";
    $parts = sqlValue($pdo, $sql, [':db'=>$dbName, ':tbl'=>TBL, ':cutoff'=>$cutoff]);

    if (!$parts) {
        echo "[SKIP] Aucune partition à supprimer (< {$cutoff}).\n";
        return;
    }

    // Construit une seule commande DROP PARTITION p1, p2, ...
    $drop = sprintf('ALTER TABLE %s DROP PARTITION %s', TBL, $parts);
    $pdo->exec($drop);
    echo "[OK] DROP PARTITION: {$parts}\n";
}

function ensurePkIncludesEventTs(PDO $pdo, string $dbName): void {
    // Vérifie que la colonne event_ts est incluse dans la PK (règle des partitions)
    $sql = "
      SELECT k.COLUMN_NAME
      FROM information_schema.TABLE_CONSTRAINTS tc
      JOIN information_schema.KEY_COLUMN_USAGE k
        ON tc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
       AND tc.TABLE_SCHEMA = k.TABLE_SCHEMA
       AND tc.TABLE_NAME = k.TABLE_NAME
      WHERE tc.TABLE_SCHEMA = :db AND tc.TABLE_NAME = :tbl AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      ORDER BY k.ORDINAL_POSITION;
    ";
    $st = $pdo->prepare($sql);
    $st->execute([':db'=>$dbName, ':tbl'=>TBL]);
    $cols = array_map(fn($r) => $r['COLUMN_NAME'], $st->fetchAll());
    if (!in_array('event_ts', $cols, true)) {
        throw new RuntimeException("La clé primaire doit inclure event_ts pour permettre le partitionnement.");
    }
}

function currentDbName(PDO $pdo): string {
    return (string)sqlValue($pdo, 'SELECT DATABASE()');
}

try {
    $pdo = pdo();
    $dbName = currentDbName($pdo);
    ensurePkIncludesEventTs($pdo, $dbName);

    $keep = (int)(env('LOGS_KEEP_MONTHS') ?? '18');
    addNextMonthPartition($pdo, $dbName);
    dropOldPartitions($pdo, $dbName, $keep);

    echo "[DONE] Rotation des partitions terminée.\n";
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, "[ERR] ".$e->getMessage()."\n");
    exit(1);
}
