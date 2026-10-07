<?php
/**
 * php/thresholds.php - Thresholds configuration API
 */

require_once __DIR__ . '/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$pdo = getDBConnection();
if (!$pdo) {
    echo json_encode(['success' => false, 'source' => 'memory']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT level_key, min_temp, max_temp, fan_speed FROM thresholds");
        $rows = $stmt->fetchAll();

        $thresholds = [];
        foreach ($rows as $r) {
            // The frontend names the middle band "med"; the table stores it as "medium"
            $key = $r['level_key'] === 'medium' ? 'med' : $r['level_key'];
            $thresholds[$key] = [
                'minTemp' => $r['min_temp'] !== null ? (float)$r['min_temp'] : null,
                'maxTemp' => $r['max_temp'] !== null ? (float)$r['max_temp'] : null,
                'speed' => (int)$r['fan_speed']
            ];
        }

        echo json_encode([
            'success' => true,
            'source' => 'mysql',
            'thresholds' => $thresholds
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $thresholds = $input['thresholds'] ?? $input;

    try {
        if (isset($thresholds['low'])) {
            $stmt = $pdo->prepare("UPDATE thresholds SET max_temp = ?, fan_speed = ?, temp_label = ? WHERE level_key = 'low'");
            $max = (float)$thresholds['low']['maxTemp'];
            $spd = (int)$thresholds['low']['speed'];
            $stmt->execute([$max, $spd, "≤ {$max}°C"]);
        }
        if (isset($thresholds['med'])) {
            $stmt = $pdo->prepare("UPDATE thresholds SET min_temp = ?, max_temp = ?, fan_speed = ?, temp_label = ? WHERE level_key = 'medium'");
            $min = (float)$thresholds['med']['minTemp'];
            $max = (float)$thresholds['med']['maxTemp'];
            $spd = (int)$thresholds['med']['speed'];
            $stmt->execute([$min, $max, $spd, "{$min}°C – {$max}°C"]);
        }
        if (isset($thresholds['high'])) {
            $stmt = $pdo->prepare("UPDATE thresholds SET min_temp = ?, fan_speed = ?, temp_label = ? WHERE level_key = 'high'");
            $min = (float)$thresholds['high']['minTemp'];
            $spd = (int)$thresholds['high']['speed'];
            $stmt->execute([$min, $spd, "≥ {$min}°C"]);
        }

        echo json_encode([
            'success' => true,
            'source' => 'mysql',
            'thresholds' => $thresholds
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
