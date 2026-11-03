<?php
declare(strict_types=1);

/**
 * Public compatibility router. Keep the existing flat .php API URLs stable;
 * implementation files are organized privately under api/<domain>/.
 */
$endpoints = [
    'register.php' => 'api/auth/register.php',
    'login.php' => 'api/auth/login.php',
    'me.php' => 'api/auth/me.php',
    'logout.php' => 'api/auth/logout.php',
    'change_password.php' => 'api/auth/change_password.php',
    'create_group.php' => 'api/groups/create_group.php',
    'create_group_auth.php' => 'api/groups/create_group_auth.php',
    'list_groups.php' => 'api/groups/list_groups.php',
    'delete_group.php' => 'api/groups/delete_group.php',
    'group_members.php' => 'api/groups/group_members.php',
    'group_invitations.php' => 'api/groups/group_invitations.php',
    'group_invite_candidates.php' => 'api/groups/group_invite_candidates.php',
    'invite_group_member.php' => 'api/groups/invite_group_member.php',
    'respond_group_invitation.php' => 'api/groups/respond_group_invitation.php',
    'assign_task.php' => 'api/tasks/assign_task.php',
    'create_task.php' => 'api/tasks/create_task.php',
    'delete_task.php' => 'api/tasks/delete_task.php',
    'get_tasks.php' => 'api/tasks/get_tasks.php',
    'update_task_status.php' => 'api/tasks/update_task_status.php',
    'update_task.php' => 'api/tasks/update_task.php',
    'task_comments.php' => 'api/tasks/task_comments.php',
    'messages.php' => 'api/chat/messages.php',
    'message_image.php' => 'api/chat/message_image.php',
    'message_reactions.php' => 'api/chat/message_reactions.php',
    'message_actions.php' => 'api/chat/message_actions.php',
    'friends.php' => 'api/social/friends.php',
    'users.php' => 'api/social/users.php',
    'send_friend_request.php' => 'api/social/send_friend_request.php',
    'respond_friend_request.php' => 'api/social/respond_friend_request.php',
    'notifications.php' => 'api/notifications/notifications.php',
    'profile.php' => 'api/profile/profile.php',
    'oauth_callback.php' => 'api/oauth/oauth_callback.php',
    'oauth_config.php' => 'api/oauth/oauth_config.php',
    'oauth_start.php' => 'api/oauth/oauth_start.php',
    'health.php' => 'api/system/health.php',
];

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$endpoint = ltrim($requestPath, '/');
$relativeTarget = $endpoints[$endpoint] ?? null;
$target = $relativeTarget === null ? false : realpath(__DIR__ . '/' . $relativeTarget);
$apiRoot = realpath(__DIR__ . '/api') . DIRECTORY_SEPARATOR;

if ($target === false || !is_file($target) || !str_starts_with($target, $apiRoot)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['success' => false, 'message' => 'Không tìm thấy API.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

require $target;
exit;
