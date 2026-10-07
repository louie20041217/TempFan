<?php
/**
 * php/setup.php - Database Initializer & Migration Utility
 */

require_once __DIR__ . '/database.php';

header('Content-Type: text/html; charset=utf-8');

$statusMessage = '';
$isSuccess = false;

try {
    $rootDsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
    $pdo = new PDO($rootDsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Create Database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `" . DB_NAME . "`");

    // Execute sql/init.sql
    $sqlPath = dirname(__DIR__) . '/sql/init.sql';
    if (file_exists($sqlPath)) {
        $sql = file_get_contents($sqlPath);
        $pdo->exec($sql);
        // Migration for installations created before DHT11 humidity support.
        $pdo->exec("ALTER TABLE readings ADD COLUMN IF NOT EXISTS humidity DECIMAL(5,2) NULL AFTER temperature");
        $isSuccess = true;
        $statusMessage = "Database `tempfan_db` and tables (`readings`, `thresholds`, `settings`, `users`) initialized successfully!";
    } else {
        $statusMessage = "Error: sql/init.sql file not found.";
    }
} catch (Exception $e) {
    $statusMessage = "MySQL Connection/Setup Error: " . $e->getMessage() . "<br><small>Please make sure MySQL is running in XAMPP Control Panel.</small>";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TempFan Database Setup</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #061e17; color: #ffffff; padding: 40px; display: flex; justify-content: center; align-items: center; min-height: 80vh; }
    .card { background: #0c2b22; border: 1px solid rgba(0, 229, 190, 0.4); border-radius: 16px; padding: 36px; max-width: 580px; width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 0.85rem; margin-bottom: 16px; }
    .badge-success { background: #00e5be; color: #042017; }
    .badge-error { background: #ef4444; color: #ffffff; }
    h1 { font-size: 1.6rem; margin-bottom: 12px; }
    p { color: #8da49c; line-height: 1.6; margin-bottom: 24px; font-size: 0.95rem; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 8px; background: #00d2aa; color: #042017; font-weight: 700; text-decoration: none; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge <?= $isSuccess ? 'badge-success' : 'badge-error' ?>">
      <?= $isSuccess ? 'SUCCESS' : 'NOTICE' ?>
    </span>
    <h1>TempFan MySQL Database Setup</h1>
    <p><?= $statusMessage ?></p>
    <a href="../html/index.html#/dashboard" class="btn">Launch TempFan Web App &rarr;</a>
  </div>
</body>
</html>
