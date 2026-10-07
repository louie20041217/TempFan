<?php
/**
 * php/profile.php - Account profile API
 *
 * Updates a user's username, email, password and profile photo.
 * The app has no server session, so every change must be confirmed with the current password.
 */

require_once __DIR__ . '/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

const PROFILE_MIN_PASSWORD_LENGTH = 6;
const PROFILE_MAX_AVATAR_LENGTH = 300000; // ~220 KB image once base64-decoded

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function rejectProfile(string $field, string $message, int $status = 422): void {
    http_response_code($status);
    echo json_encode(['success' => false, 'field' => $field, 'error' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rejectProfile('form', 'Method not allowed.', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    rejectProfile('form', 'Invalid request.', 400);
}

$currentIdentifier = trim((string)($input['currentUsername'] ?? ''));
$currentPassword = (string)($input['currentPassword'] ?? '');
$username = trim((string)($input['username'] ?? ''));
$email = trim((string)($input['email'] ?? ''));
$newPassword = (string)($input['newPassword'] ?? '');
// null = keep the current photo, '' = remove it, data URL = replace it
$avatar = array_key_exists('avatar', $input) ? $input['avatar'] : null;

if ($currentIdentifier === '' || $currentPassword === '') {
    rejectProfile('currentPassword', 'Enter your current password to save changes.');
}
if (!preg_match('/^[A-Za-z0-9_.-]{3,50}$/', $username)) {
    rejectProfile('username', 'Use 3-50 letters, numbers, dots, dashes or underscores.');
}
if (strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    rejectProfile('email', 'Please enter a valid email address.');
}
if ($newPassword !== '' && strlen($newPassword) < PROFILE_MIN_PASSWORD_LENGTH) {
    rejectProfile('newPassword', 'Password must be at least ' . PROFILE_MIN_PASSWORD_LENGTH . ' characters.');
}

if ($avatar !== null) {
    if (!is_string($avatar)) {
        rejectProfile('avatar', 'The profile photo is not valid.');
    }
    if ($avatar !== '') {
        if (strlen($avatar) > PROFILE_MAX_AVATAR_LENGTH
            || !preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$#', $avatar, $match)) {
            rejectProfile('avatar', 'The profile photo must be a JPG, PNG or WebP image.');
        }
        $binary = base64_decode($match[2], true);
        if ($binary === false || @getimagesizefromstring($binary) === false) {
            rejectProfile('avatar', 'The profile photo could not be read as an image.');
        }
    }
}

$pdo = getDBConnection();
if (!$pdo) {
    rejectProfile('form', 'The database is unavailable. Please try again shortly.', 503);
}

try {
    // Added on demand so existing installations work without re-running setup.
    $pdo->exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar MEDIUMTEXT NULL');

    $stmt = $pdo->prepare('SELECT id, username, email, password_hash, role, avatar FROM users WHERE username = ? OR email = ? LIMIT 1');
    $stmt->execute([$currentIdentifier, $currentIdentifier]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        rejectProfile('currentPassword', 'Your current password is incorrect.', 401);
    }

    $stmt = $pdo->prepare('SELECT username, email FROM users WHERE (username = ? OR email = ?) AND id <> ? LIMIT 1');
    $stmt->execute([$username, $email, (int)$user['id']]);
    $taken = $stmt->fetch();
    if ($taken) {
        if (strcasecmp($taken['username'], $username) === 0) {
            rejectProfile('username', 'That username is already taken.', 409);
        }
        rejectProfile('email', 'An account with that email already exists.', 409);
    }

    $newAvatar = $avatar === null ? $user['avatar'] : ($avatar === '' ? null : $avatar);
    $newHash = $newPassword !== '' ? password_hash($newPassword, PASSWORD_DEFAULT) : $user['password_hash'];

    $stmt = $pdo->prepare('UPDATE users SET username = ?, email = ?, password_hash = ?, avatar = ? WHERE id = ?');
    $stmt->execute([$username, $email, $newHash, $newAvatar, (int)$user['id']]);

    echo json_encode([
        'success' => true,
        'passwordChanged' => $newPassword !== '',
        'user' => [
            'id' => (int)$user['id'],
            'name' => $username,
            'email' => $email,
            'role' => $user['role'],
            'avatar' => $newAvatar
        ]
    ]);
} catch (Exception $e) {
    error_log('Profile update failed: ' . $e->getMessage());
    rejectProfile('form', 'Your profile could not be updated. Please try again.', 500);
}
