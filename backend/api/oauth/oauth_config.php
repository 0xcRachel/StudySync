<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
require_once dirname(__DIR__, 2) . '/core/oauth.php';
$oauth = app_config()['oauth'];
send_json(['success' => true, 'data' => oauth_providers($oauth)]);
