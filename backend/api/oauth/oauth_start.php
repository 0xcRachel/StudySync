<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
require_once dirname(__DIR__, 2) . '/core/oauth.php';
$oauth = app_config()['oauth'];
$provider = (string) ($_GET['provider'] ?? '');
$providers = oauth_providers($oauth);
if (!isset($providers[$provider]) || !$providers[$provider]) oauth_redirect($oauth['app_url'], ['oauth_error' => 'Nhà cung cấp này chưa được cấu hình trong backend/.env.']);
session_start();
$state = bin2hex(random_bytes(32));
$callback = $oauth['callback_url'] . '?provider=' . rawurlencode($provider);
$entry = ['state' => $state, 'created' => time()];
if ($provider === 'google') {
    $verifier = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
    $entry['verifier'] = $verifier;
    $_SESSION['studysync_oauth_google'] = $entry;
    $query = [
        'client_id' => $oauth['google_client_id'], 'redirect_uri' => $callback,
        'response_type' => 'code', 'scope' => 'openid email profile', 'state' => $state,
        'code_challenge' => rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '='),
        'code_challenge_method' => 'S256', 'prompt' => 'select_account',
    ];
    header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($query), true, 302);
} else {
    $_SESSION['studysync_oauth_facebook'] = $entry;
    $query = ['client_id' => $oauth['facebook_app_id'], 'redirect_uri' => $callback, 'response_type' => 'code', 'scope' => 'email,public_profile', 'state' => $state];
    header('Location: https://www.facebook.com/' . rawurlencode($oauth['facebook_graph_version']) . '/dialog/oauth?' . http_build_query($query), true, 302);
}
exit;
