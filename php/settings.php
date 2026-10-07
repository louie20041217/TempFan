<?php
/**
 * php/settings.php - Control mode & manual fan speed settings API
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
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
        $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        // The ESP32 posts every 3 seconds, so it only counts as online while its telemetry is recent.
        $isOnline = (int)$pdo->query("SELECT COUNT(*) FROM settings WHERE setting_key = 'system_status' AND setting_value = 'online' AND updated_at >= NOW() - INTERVAL 15 SECOND")->fetchColumn() > 0;

        echo json_encode([
            'success' => true,
            'source' => 'mysql',
            'controlMode' => $rows['control_mode'] ?? 'Automatic',
            'manualFanSpeed' => isset($rows['manual_fan_speed']) ? (int)$rows['manual_fan_speed'] : 70,
            'systemStatus' => $isOnline ? 'online' : 'offline',
            'hardwarePlatform' => $rows['hardware_platform'] ?? 'ESP32 Development Board',
            'temperatureSensor' => $rows['temperature_sensor'] ?? 'DHT11 Temperature and Humidity Sensor'
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $mode = $input['controlMode'] ?? null;
    $speed = isset($input['manualFanSpeed']) ? (int)$input['manualFanSpeed'] : null;

    try {
        if ($mode !== null) {
            $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('control_mode', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->execute([$mode, $mode]);
        }
        if ($speed !== null) {
            $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('manual_fan_speed', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->execute([$speed, $speed]);
        }

        echo json_encode([
            'success' => true,
            'source' => 'mysql',
            'controlMode' => $mode,
            'manualFanSpeed' => $speed
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
