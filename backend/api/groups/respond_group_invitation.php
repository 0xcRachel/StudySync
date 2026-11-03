<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST'); $me = require_auth(); $data = read_request_data(); $invitationId = parse_positive_int($data['invitation_id'] ?? null, 'Mã lời mời'); $action = strtolower((string) ($data['action'] ?? '')); if (!in_array($action, ['accept', 'decline'], true)) throw new ApiException(422, 'Action phải là accept hoặc decline.'); $pdo = db();
    $statement = $pdo->prepare('SELECT * FROM group_invitations WHERE id = ? AND invitee_id = ? AND status = "pending" LIMIT 1'); $statement->execute([$invitationId, $me['id']]); $invitation = $statement->fetch(); if ($invitation === false) throw new ApiException(404, 'Không tìm thấy lời mời nhóm.');
    $status = $action === 'accept' ? 'accepted' : 'declined'; $pdo->beginTransaction(); try { $pdo->prepare('UPDATE group_invitations SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$status, $invitationId]); if ($status === 'accepted') $pdo->prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "member")')->execute([(int) $invitation['group_id'], $me['id']]); $pdo->commit(); } catch (Throwable $error) { $pdo->rollBack(); throw $error; }
    send_json(['success' => true, 'message' => $status === 'accepted' ? 'Đã tham gia nhóm.' : 'Đã từ chối lời mời.']);
});
