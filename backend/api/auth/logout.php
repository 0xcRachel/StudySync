<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void { require_method('POST'); $user = require_auth(); db()->prepare('DELETE FROM user_sessions WHERE id = ?')->execute([$user['session_id']]); send_json(['success' => true, 'message' => 'Đã đăng xuất.']); });
