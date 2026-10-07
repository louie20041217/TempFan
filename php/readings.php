<?php
/**
 * php/readings.php - Endpoint for telemetry readings
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
    echo json_encode(['success' => false, 'source' => 'memory', 'message' => 'MySQL database offline or unavailable']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, temperature, humidity, fan_speed, fan_status, mode, created_at FROM readings ORDER BY id DESC LIMIT 12");
        $rows = $stmt->fetchAll();
        $reversed = array_reverse($rows);

        $readings = array_map(function($r) {
            $time = date('g:i A', strtotime($r['created_at']));
            return [
                'id' => (int)$r['id'],
                'temp' => (float)$r['temperature'],
                'humidity' => $r['humidity'] !== null ? (float)$r['humidity'] : null,
                'speed' => (int)$r['fan_speed'],
                'status' => $r['fan_status'],
                'timeLabel' => $time,
                'timestamp' => $r['created_at']
            ];
        }, $reversed);

        $latest = end($readings) ?: null;

        echo json_encode([
            'success' => true,
            'source' => 'mysql',
            'latest' => $latest,
            'readings' => $readings
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $temp = isset($input['temperature']) ? (float)$input['temperature'] : null;
    $humidity = isset($input['humidity']) && $input['humidity'] !== '' ? (float)$input['humidity'] : null;
    $speed = isset($input['fanSpeed']) ? (int)$input['fanSpeed'] : 0;
    $status = isset($input['fanStatus']) ? $input['fanStatus'] : ($speed > 0 ? 'ON' : 'OFF');
    $mode = isset($input['controlMode']) ? $input['controlMode'] : 'Automatic';

    if ($temp === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Temperature is required']);
        exit;
    }
    if ($temp < -40 || $temp > 125 || ($humidity !== null && ($humidity < 0 || $humidity > 100)) || $speed < 0 || $speed > 100) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Telemetry values are outside the supported range.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO readings (temperature, humidity, fan_speed, fan_status, mode, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$temp, $humidity, $speed, $status, $mode]);
        $newId = $pdo->lastInsertId();
        if (($input['source'] ?? '') === 'ESP32') {
            $pdo->exec("INSERT INTO settings (setting_key, setting_value) VALUES ('system_status', 'online') ON DUPLICATE KEY UPDATE setting_value = 'online', updated_at = NOW()");
        }

        echo json_encode([
            'success' => true,
            'id' => $newId,
            'temperature' => $temp,
            'humidity' => $humidity,
            'fanSpeed' => $speed,
            'fanStatus' => $status,
            'controlMode' => $mode
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
