<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
require_once dirname(__DIR__, 2) . '/core/oauth.php';
$oauth = app_config()['oauth'];
session_start();
$provider = (string) ($_GET['provider'] ?? '');
$key = 'studysync_oauth_' . $provider;
$attempt = $_SESSION[$key] ?? null;
unset($_SESSION[$key]);
try {
    if (!in_array($provider, ['google', 'facebook'], true) || !is_array($attempt)
        || !isset($_GET['state'], $attempt['state']) || !hash_equals((string) $attempt['state'], (string) $_GET['state'])
        || time() - (int) ($attempt['created'] ?? 0) > 600 || !isset($_GET['code'])) {
        throw new RuntimeException('Yêu cầu đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
    }
    $config = app_config()['oauth'];
    $callback = $config['callback_url'] . '?provider=' . rawurlencode($provider);
    if ($provider === 'google') {
        $token = oauth_http('https://oauth2.googleapis.com/token', [
            'code' => (string) $_GET['code'], 'client_id' => $config['google_client_id'],
            'client_secret' => $config['google_client_secret'], 'redirect_uri' => $callback,
            'grant_type' => 'authorization_code', 'code_verifier' => (string) ($attempt['verifier'] ?? ''),
        ]);
        $profile = oauth_http('https://openidconnect.googleapis.com/v1/userinfo', null, (string) ($token['access_token'] ?? ''));
        if (($profile['email_verified'] ?? false) !== true) throw new RuntimeException('Google chưa xác nhận email của tài khoản này.');
        $subject = (string) ($profile['sub'] ?? '');
        $email = filter_var((string) ($profile['email'] ?? ''), FILTER_VALIDATE_EMAIL) ? strtolower((string) $profile['email']) : '';
        $name = (string) ($profile['name'] ?? 'Người học StudySync');
        $avatar = filter_var((string) ($profile['picture'] ?? ''), FILTER_VALIDATE_URL) ? (string) $profile['picture'] : null;
    } else {
        $version = $config['facebook_graph_version'];
        $token = oauth_http('https://graph.facebook.com/' . rawurlencode($version) . '/oauth/access_token?' . http_build_query([
            'client_id' => $config['facebook_app_id'], 'client_secret' => $config['facebook_app_secret'],
            'redirect_uri' => $callback, 'code' => (string) $_GET['code'],
        ]));
        $profile = oauth_http('https://graph.facebook.com/' . rawurlencode($version) . '/me?fields=id,name,email,picture.type(large)&' . http_build_query(['access_token' => (string) ($token['access_token'] ?? '')]));
        $subject = (string) ($profile['id'] ?? '');
        $email = filter_var((string) ($profile['email'] ?? ''), FILTER_VALIDATE_EMAIL) ? strtolower((string) $profile['email']) : '';
        $name = (string) ($profile['name'] ?? 'Người học StudySync');
        $avatar = filter_var((string) ($profile['picture']['data']['url'] ?? ''), FILTER_VALIDATE_URL) ? (string) $profile['picture']['data']['url'] : null;
    }
    if ($subject === '' || $email === '') throw new RuntimeException('Nhà cung cấp không trả về mã tài khoản và email. Hãy cấp quyền email rồi thử lại.');

    $pdo = db();
    if (app_config()['db']['driver'] !== 'mysql') throw new RuntimeException('Đăng nhập mạng xã hội hiện yêu cầu MySQL/MariaDB.');
    $lookup = $pdo->prepare('SELECT u.id, u.name, u.username, u.email, u.avatar_url, u.bio, u.last_seen_at, u.created_at FROM oauth_accounts oa JOIN users u ON u.id = oa.user_id WHERE oa.provider = ? AND oa.provider_subject = ? LIMIT 1');
    $lookup->execute([$provider, $subject]);
    $user = $lookup->fetch();
    if ($user === false) {
        $existing = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $existing->execute([$email]);
        if ($existing->fetchColumn() !== false) throw new RuntimeException('Email đã có tài khoản StudySync bằng phương thức khác. Hãy tiếp tục dùng phương thức đăng nhập ban đầu; liên kết tài khoản an toàn hiện chưa được bật.');
        $displayName = parse_user_name($name);
        $pdo->prepare('INSERT INTO users (name, email, password_hash, avatar_url) VALUES (?, ?, ?, ?)')
            ->execute([$displayName, $email, password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT), $avatar]);
        $userId = (int) $pdo->lastInsertId();
        $pdo->prepare('INSERT INTO oauth_accounts (user_id, provider, provider_subject) VALUES (?, ?, ?)')->execute([$userId, $provider, $subject]);
        $statement = $pdo->prepare('SELECT id, name, username, email, avatar_url, bio, last_seen_at, created_at FROM users WHERE id = ?');
        $statement->execute([$userId]);
        $user = $statement->fetch();
    }
    $sessionToken = issue_session($pdo, (int) $user['id']);
    oauth_redirect($config['app_url'], ['oauth_token' => $sessionToken, 'oauth_user' => json_encode(public_user($user), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
} catch (Throwable $error) {
    error_log('[StudySync OAuth] ' . $error->getMessage());
    oauth_redirect($oauth['app_url'], ['oauth_error' => $error instanceof ApiException ? $error->getMessage() : $error->getMessage()]);
}
