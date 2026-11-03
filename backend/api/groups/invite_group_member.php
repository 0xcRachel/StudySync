<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST'); $me = require_auth(); $data = read_request_data(); $groupId = parse_positive_int($data['group_id'] ?? null, 'Mã nhóm'); $inviteeId = parse_positive_int($data['user_id'] ?? null, 'Mã người dùng'); $pdo = db(); require_group_member($pdo, $groupId, $me['id'], ['owner', 'admin']);
    $group = $pdo->prepare('SELECT `name` FROM `groups` WHERE `id` = ?'); $group->execute([$groupId]); $groupRow = $group->fetch(); if ($groupRow === false) throw new ApiException(404, 'Nhóm không tồn tại.');
    $user = $pdo->prepare('SELECT id, name FROM users WHERE id = ? AND is_active = 1'); $user->execute([$inviteeId]); $invitee = $user->fetch(); if ($invitee === false) throw new ApiException(404, 'Người dùng không tồn tại.');
    $member = $pdo->prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'); $member->execute([$groupId, $inviteeId]); if ($member->fetchColumn() !== false) throw new ApiException(409, 'Người dùng đã ở trong nhóm.');
    $pending = $pdo->prepare('SELECT 1 FROM group_invitations WHERE group_id = ? AND invitee_id = ? AND status = "pending"'); $pending->execute([$groupId, $inviteeId]); if ($pending->fetchColumn() !== false) throw new ApiException(409, 'Lời mời đã được gửi trước đó.');
    $pdo->prepare('INSERT INTO group_invitations (group_id, inviter_id, invitee_id) VALUES (?, ?, ?)')->execute([$groupId, $me['id'], $inviteeId]); notify_user($pdo, $inviteeId, 'group_invitation', 'Lời mời tham gia nhóm', $me['name'] . ' mời bạn vào nhóm ' . $groupRow['name'] . '.', ['group_id' => $groupId]); send_json(['success' => true, 'message' => 'Đã gửi lời mời vào nhóm.'], 201);
});
