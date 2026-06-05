<?php
/**
 * Minimal /api forwarder for shared hosting (cPanel PHP).
 * Only paths starting with /api/ are forwarded — not an open proxy.
 */
declare(strict_types=1);

$configPath = __DIR__ . '/osg-proxy-config.php';
if (!is_readable($configPath)) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'proxy_config_missing']);
    exit;
}

/** @var array{upstream_base: string} $config */
$config = require $configPath;
$base = rtrim((string) ($config['upstream_base'] ?? ''), '/');
if ($base === '') {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'proxy_upstream_empty']);
    exit;
}

$uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$path = parse_url($uri, PHP_URL_PATH);
if (!is_string($path) || strpos($path, '/api/') !== 0) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'only_api_prefix']);
    exit;
}

$target = $base . $uri;

$ch = curl_init($target);
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$headers = [];
$hop = [
    'HTTP_ACCEPT',
    'HTTP_CONTENT_TYPE',
    'HTTP_AUTHORIZATION',
    'HTTP_ORIGIN',
    'HTTP_REFERER',
    'HTTP_X_FORWARDED_FOR',
];
foreach ($hop as $k) {
    if (!empty($_SERVER[$k])) {
        $name = str_replace('HTTP_', '', $k);
        $name = str_replace('_', '-', $name);
        if ($name === 'CONTENT-TYPE') {
            $headers[] = 'Content-Type: ' . $_SERVER[$k];
        } else {
            $headers[] = $name . ': ' . $_SERVER[$k];
        }
    }
}
if ($headers) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

$body = file_get_contents('php://input');
if ($body !== false && $body !== '' && in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'proxy_curl', 'detail' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

$status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$rawBody = substr($response, $headerSize);

foreach (explode("\r\n", $rawHeaders) as $line) {
    if ($line === '' || stripos($line, 'HTTP/') === 0) {
        continue;
    }
    if (stripos($line, 'Transfer-Encoding:') === 0) {
        continue;
    }
    header($line, false);
}

http_response_code($status > 0 ? $status : 502);
echo $rawBody;
