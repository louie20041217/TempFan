<?php
/**
 * php/forgot_password.php - Password reset API
 *
 * action "request": issues a 6-digit verification code for a registered email.
 * action "reset":   verifies the code and stores the new password.
 */

require_once __DIR__ . '/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

const RESET_CODE_TTL_MINUTES = 15;
const RESET_MAX_ATTEMPTS = 5;
const RESET_MIN_PASSWORD_LENGTH = 6;

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function respond(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$action = (string)($input['action'] ?? 'request');
$email = trim((string)($input['email'] ?? ''));

if (strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['success' => false, 'error' => 'Please enter a valid email address.'], 422);
}

$pdo = getDBConnection();
if (!$pdo) {
    respond(['success' => false, 'error' => 'The database is unavailable. Please try again shortly.'], 503);
}

// True only when the browser runs on the same machine as XAMPP (local development).
function isLocalRequest(): bool {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    return in_array($remote, ['127.0.0.1', '::1'], true) && empty($_SERVER['HTTP_X_FORWARDED_FOR']);
}

function sendResetEmail(string $email, string $username, string $code): bool {
    $subject = 'TempFan password reset code';
    $message = "Hello {$username},\r\n\r\n"
        . "Your TempFan password reset code is: {$code}\r\n\r\n"
        . 'This code expires in ' . RESET_CODE_TTL_MINUTES . " minutes.\r\n"
        . "If you did not request a password reset, you can ignore this email.\r\n";
    $headers = "From: TempFan <no-reply@tempfan.io>\r\nContent-Type: text/plain; charset=utf-8";

    return @mail($email, $subject, $message, $headers);
}

try {
    // Created on demand so existing installations work without re-running setup.
    $pdo->exec("CREATE TABLE IF NOT EXISTS `password_resets` (
        `user_id` INT NOT NULL PRIMARY KEY,
        `code_hash` VARCHAR(255) NOT NULL,
        `attempts` INT NOT NULL DEFAULT 0,
        `expires_at` DATETIME NOT NULL,
        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $stmt = $pdo->prepare('SELECT id, username, email FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($action === 'request') {
        if (!$user) {
            respond(['success' => false, 'error' => 'No account is registered with that email address.'], 404);
        }

        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare('REPLACE INTO password_resets (user_id, code_hash, attempts, expires_at)
            VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL ' . RESET_CODE_TTL_MINUTES . ' MINUTE))');
        $stmt->execute([(int)$user['id'], password_hash($code, PASSWORD_DEFAULT)]);

        if (sendResetEmail($user['email'], $user['username'], $code)) {
            respond(['success' => true, 'delivered' => true]);
        }

        // No mail server configured: on the local machine, hand the code back so the reset still works.
        if (isLocalRequest()) {
            respond(['success' => true, 'delivered' => false, 'devCode' => $code]);
        }

        $pdo->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([(int)$user['id']]);
        respond(['success' => false, 'error' => 'The reset email could not be sent. Please contact the administrator.'], 503);
    }

    if ($action === 'reset') {
        $code = trim((string)($input['code'] ?? ''));
        $password = (string)($input['password'] ?? '');

        if (strlen($password) < RESET_MIN_PASSWORD_LENGTH) {
            respond(['success' => false, 'retry' => false, 'error' => 'Password must be at least ' . RESET_MIN_PASSWORD_LENGTH . ' characters.'], 422);
        }

        $reset = null;
        if ($user) {
            $stmt = $pdo->prepare('SELECT code_hash, attempts FROM password_resets WHERE user_id = ? AND expires_at > NOW() LIMIT 1');
            $stmt->execute([(int)$user['id']]);
            $reset = $stmt->fetch();
        }

        if (!$reset || (int)$reset['attempts'] >= RESET_MAX_ATTEMPTS) {
            respond(['success' => false, 'retry' => false, 'error' => 'This reset code has expired. Please request a new one.'], 400);
        }

        if (!password_verify($code, $reset['code_hash'])) {
            $pdo->prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE user_id = ?')->execute([(int)$user['id']]);
            $remaining = RESET_MAX_ATTEMPTS - (int)$reset['attempts'] - 1;
            if ($remaining <= 0) {
                respond(['success' => false, 'retry' => false, 'error' => 'Too many incorrect codes. Please request a new one.'], 400);
            }
            respond(['success' => false, 'retry' => true, 'error' => 'Incorrect reset code. Please try again.'], 400);
        }

        $pdo->beginTransaction();
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            ->execute([password_hash($password, PASSWORD_DEFAULT), (int)$user['id']]);
        $pdo->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([(int)$user['id']]);
        $pdo->commit();

        respond(['success' => true]);
    }

    respond(['success' => false, 'error' => 'Unknown action.'], 400);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Password reset failed: ' . $e->getMessage());
    respond(['success' => false, 'error' => 'Password reset could not be completed. Please try again.'], 500);
}
