<?php
declare(strict_types=1);

function oauth_http(string $url, ?array $form = null, ?string $bearer = null): array
{
    if (!function_exists('curl_init')) throw new RuntimeException('PHP cURL extension chưa được bật trong Laragon.');
    $curl = curl_init($url);
    $headers = ['Accept: application/json'];
    if ($bearer !== null) $headers[] = 'Authorization: Bearer ' . $bearer;
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    if ($form !== null) {
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($form));
    }
    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if (!is_string($body) || $status < 200 || $status >= 300) throw new RuntimeException('Không xác thực được tài khoản qua nhà cung cấp.' . ($error !== '' ? ' ' . $error : ''));
    $data = json_decode($body, true);
    if (!is_array($data)) throw new RuntimeException('Nhà cung cấp trả về dữ liệu không hợp lệ.');
    return $data;
}

function oauth_redirect(string $appUrl, array $params): never
{
    header('Location: ' . $appUrl . '/#/?' . http_build_query($params), true, 302);
    exit;
}

function oauth_providers(array $oauth): array
{
    $mysqlReady = app_config()['db']['driver'] === 'mysql';
    return [
        'google' => $mysqlReady && $oauth['google_client_id'] !== '' && $oauth['google_client_secret'] !== '',
        'facebook' => $mysqlReady && $oauth['facebook_app_id'] !== '' && $oauth['facebook_app_secret'] !== '',
    ];
}
