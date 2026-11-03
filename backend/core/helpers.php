<?php

declare(strict_types=1);

/**
 * Lỗi nghiệp vụ của API. Mọi lỗi đều được trả về dưới dạng JSON thống nhất.
 */
final class ApiException extends RuntimeException
{
    public int $status;

    /** @var array<string, mixed> */
    public array $details;

    /**
     * @param array<string, mixed> $details
     */
    public function __construct(int $status, string $message, array $details = [])
    {
        parent::__construct($message);
        $this->status = $status;
        $this->details = $details;
    }
}

/**
 * Đọc file .env đơn giản, không cần Composer.
 * Biến đã có trong môi trường hệ thống luôn được ưu tiên hơn file .env.
 */
function load_env(string $path): void
{
    if (!is_file($path) || !is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);

        if ($key === '' || preg_match('/^[A-Z0-9_]+$/i', $key) !== 1) {
            continue;
        }

        // Không ghi đè biến đã được thiết lập bởi hệ điều hành/Docker/CI.
        if (getenv($key) !== false) {
            continue;
        }

        $value = trim($value);
        $length = strlen($value);

        if (
            $length >= 2
            && (($value[0] === '"' && $value[$length - 1] === '"')
                || ($value[0] === "'" && $value[$length - 1] === "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
    }
}

function env_value(string $key, ?string $default = null): ?string
{
    $value = getenv($key);

    if ($value === false) {
        return $default;
    }

    return $value;
}

/**
 * Cấu hình được nạp một lần cho mỗi request.
 *
 * @return array<string, mixed>
 */
function app_config(): array
{
    static $config = null;

    if ($config === null) {
        $loaded = require __DIR__ . '/config.php';

        if (!is_array($loaded)) {
            throw new RuntimeException('config.php phải trả về một mảng cấu hình.');
        }

        $config = $loaded;
    }

    return $config;
}

/**
 * @param array<string, mixed> $payload
 */
function send_json(array $payload, int $status = 200): never
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
    }

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($json === false) {
        $json = '{"success":false,"message":"Không thể mã hoá phản hồi."}';
    }

    echo $json;
    exit;
}

/**
 * @param array<string, mixed> $extra
 */
function send_error(string $message, int $status, array $extra = []): never
{
    send_json(['success' => false, 'message' => $message] + $extra, $status);
}

function require_method(string ...$allowed): string
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    if (!in_array($method, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        throw new ApiException(405, 'Phương thức không được hỗ trợ.');
    }

    return $method;
}

/**
 * Hỗ trợ cả JSON (application/json) và form-urlencoded ($_POST).
 *
 * @return array<string, mixed>
 */
function read_request_data(): array
{
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');

    if (str_contains($contentType, 'application/json')) {
        $raw = file_get_contents('php://input');

        if ($raw === false || trim($raw) === '') {
            return [];
        }

        try {
            $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException $error) {
            throw new ApiException(400, 'Dữ liệu JSON không hợp lệ.', [
                'detail' => $error->getMessage(),
            ]);
        }

        if (!is_array($data)) {
            throw new ApiException(400, 'Dữ liệu gửi lên phải là một đối tượng JSON.');
        }

        return $data;
    }

    return $_POST;
}

function parse_positive_int(mixed $value, string $fieldLabel): int
{
    if (is_int($value)) {
        if ($value > 0) {
            return $value;
        }
    } elseif (is_string($value) && preg_match('/^[0-9]+$/', trim($value)) === 1) {
        $parsed = (int) trim($value);
        if ($parsed > 0) {
            return $parsed;
        }
    } elseif (is_float($value) && $value > 0 && floor($value) === $value) {
        return (int) $value;
    }

    throw new ApiException(422, $fieldLabel . ' không hợp lệ.');
}

function parse_title(mixed $value): string
{
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')) {
        throw new ApiException(422, 'Tên công việc không hợp lệ.');
    }

    $title = trim($value);

    if ($title === '') {
        throw new ApiException(422, 'Vui lòng nhập tên công việc.');
    }

    // Loại bỏ ký tự điều khiển và gộp khoảng trắng thừa.
    $title = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $title) ?? $title;
    $title = trim(preg_replace('/\s+/u', ' ', $title) ?? $title);

    if ($title === '') {
        throw new ApiException(422, 'Vui lòng nhập tên công việc.');
    }

    if (mb_strlen($title, 'UTF-8') > 120) {
        throw new ApiException(422, 'Tên công việc không được dài quá 120 ký tự.');
    }

    return $title;
}

function parse_group_name(mixed $value): string
{
    if (!is_string($value)) throw new ApiException(422, 'Tên nhóm không hợp lệ.');
    $name = trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
    if ($name === '') throw new ApiException(422, 'Vui lòng nhập tên nhóm.');
    if (mb_strlen($name, 'UTF-8') > 120) throw new ApiException(422, 'Tên nhóm không được dài quá 120 ký tự.');
    return $name;
}

function parse_status(mixed $value): string
{
    $status = is_string($value) ? strtolower(trim($value)) : '';

    if (!in_array($status, ['todo', 'doing', 'done'], true)) {
        throw new ApiException(422, 'Trạng thái không hợp lệ. Chỉ nhận todo, doing hoặc done.');
    }

    return $status;
}

/**
 * @param array<string, mixed> $row
 * @return array<string, mixed>
 */
function task_to_array(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'group_id' => (int) $row['group_id'],
        'title' => (string) $row['title'],
        'status' => (string) $row['status'],
        'created_at' => (string) ($row['created_at'] ?? ''),
        'updated_at' => (string) ($row['updated_at'] ?? ''),
        'assignees' => $row['assignees'] ?? [],
    ];
}

/** @param array<int, array<string, mixed>> $tasks */
function attach_task_assignees(PDO $pdo, array $tasks): array
{
    if ($tasks === []) return [];
    $ids = array_map(static fn (array $task): int => (int) $task['id'], $tasks);
    $marks = implode(',', array_fill(0, count($ids), '?'));
    $statement = $pdo->prepare('SELECT ta.task_id, u.id, u.name, u.username, u.avatar_url FROM task_assignees ta JOIN users u ON u.id = ta.user_id WHERE ta.task_id IN (' . $marks . ') ORDER BY u.name');
    $statement->execute($ids);
    $byTask = [];
    foreach ($statement->fetchAll() as $person) {
        $byTask[(int) $person['task_id']][] = [
            'id' => (int) $person['id'],
            'name' => (string) $person['name'],
            'username' => $person['username'] ?? null,
            'avatar_url' => $person['avatar_url'] ?? null,
        ];
    }
    foreach ($tasks as &$task) $task['assignees'] = $byTask[(int) $task['id']] ?? [];
    unset($task);
    return $tasks;
}

/**
 * @return array<string, mixed>|null
 */
function find_task(PDO $pdo, int $taskId): ?array
{
    $statement = $pdo->prepare(
        'SELECT id, group_id, title, status, created_at, updated_at FROM tasks WHERE id = ? LIMIT 1'
    );
    $statement->execute([$taskId]);
    $row = $statement->fetch();

    if ($row === false) return null;
    $items = attach_task_assignees($pdo, [task_to_array($row)]);
    return $items[0];
}

function ensure_group_exists(PDO $pdo, int $groupId): void
{
    $statement = $pdo->prepare('SELECT id FROM `groups` WHERE id = ? LIMIT 1');
    $statement->execute([$groupId]);

    if ($statement->fetchColumn() === false) {
        throw new ApiException(404, 'Nhóm học tập không tồn tại.');
    }
}

/**
 * Bọc endpoint để mọi lỗi đều trả JSON, không lộ HTML/PHP warning ra client.
 *
 * @param callable(): void $handler
 */
function run_api(callable $handler): never
{
    try {
        $handler();
    } catch (ApiException $error) {
        send_error($error->getMessage(), $error->status, $error->details);
    } catch (Throwable $error) {
        error_log(sprintf(
            '[StudySync API] %s: %s in %s:%d',
            $error::class,
            $error->getMessage(),
            $error->getFile(),
            $error->getLine()
        ));

        send_error('Máy chủ gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.', 500);
    }

    // Mọi handler hợp lệ đều phải gọi send_json() và exit.
    send_error('Máy chủ không trả về dữ liệu.', 500);
}
