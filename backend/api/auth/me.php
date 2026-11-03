<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void { require_method('GET'); $user = require_auth(); unset($user['session_id']); send_json(['success' => true, 'data' => ['user' => $user]]); });
