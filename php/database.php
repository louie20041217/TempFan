<?php
/**
 * php/database.php - Resilient MySQL PDO Connection Manager for XAMPP
 */

define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'tempfan_db');
define('DB_USER', 'root');
define('DB_PASS', '');

function getDBConnection(): ?PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 2,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // If database does not exist (error 1049), auto-create database and import sql/init.sql
        if ($e->getCode() == 1049 || strpos($e->getMessage(), 'Unknown database') !== false) {
            try {
                $rootDsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
                $rootPdo = new PDO($rootDsn, DB_USER, DB_PASS, $options);
                $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                $sqlPath = dirname(__DIR__) . '/sql/init.sql';
                if (file_exists($sqlPath)) {
                    $sql = file_get_contents($sqlPath);
                    $pdo->exec($sql);
                }
                return $pdo;
            } catch (PDOException $createEx) {
                error_log('Database auto-creation failed: ' . $createEx->getMessage());
                return null;
            }
        }

        error_log('Database connection failed: ' . $e->getMessage());
        return null;
    }
}
