<?php
/**
 * php/register.php - User registration API
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
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

$username = isset($input['username']) ? trim((string)$input['username']) : '';
$email = isset($input['email']) ? trim((string)$input['email']) : '';
$password = isset($input['password']) ? (string)$input['password'] : '';

function rejectField(string $field, string $message, int $status = 422): void {
    http_response_code($status);
    echo json_encode(['success' => false, 'field' => $field, 'error' => $message]);
    exit;
}

if (!preg_match('/^[A-Za-z0-9_.-]{3,50}$/', $username)) {
    rejectField('username', 'Use 3-50 letters, numbers, dots, dashes or underscores.');
}
if (strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    rejectField('email', 'Please enter a valid email address.');
}
if (strlen($password) < 6) {
    rejectField('password', 'Password must be at least 6 characters.');
}

$pdo = getDBConnection();
if (!$pdo) {
    echo json_encode(['success' => false, 'source' => 'memory']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT username, email FROM users WHERE username = ? OR email = ? LIMIT 1");
    $stmt->execute([$username, $email]);
    $existing = $stmt->fetch();

    if ($existing) {
        if (strcasecmp($existing['username'], $username) === 0) {
            rejectField('username', 'That username is already taken.', 409);
        }
        rejectField('email', 'An account with that email already exists.', 409);
    }

    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
    $stmt->execute([$username, $email, password_hash($password, PASSWORD_DEFAULT)]);

    echo json_encode([
        'success' => true,
        'source' => 'mysql',
        'id' => (int)$pdo->lastInsertId(),
        'username' => $username,
        'email' => $email
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'field' => 'form', 'error' => 'Registration could not be completed. Please try again.']);
}
