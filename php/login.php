<?php
/**
 * Authenticates a TempFan user against the MySQL users table.
 */

require_once __DIR__ . '/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$identifier = trim((string)($input['identifier'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($identifier === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Username or email and password are required.']);
    exit;
}

$pdo = getDBConnection();
if (!$pdo) {
    http_response_code(503);
    echo json_encode(['success' => false, 'error' => 'The database is unavailable. Please try again shortly.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ? LIMIT 1');
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid username/email or password.']);
        exit;
    }

    $avatar = null;
    try {
        $stmt = $pdo->prepare('SELECT avatar FROM users WHERE id = ?');
        $stmt->execute([(int)$user['id']]);
        $avatar = $stmt->fetchColumn() ?: null;
    } catch (Exception $e) {
        // The avatar column is added the first time a profile is saved.
    }

    echo json_encode([
        'success' => true,
        'source' => 'mysql',
        'user' => [
            'id' => (int)$user['id'],
            'name' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'avatar' => $avatar
        ]
    ]);
} catch (Exception $e) {
    error_log('Login failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Login could not be completed. Please try again.']);
}
