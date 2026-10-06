<?php
// Loads credentials from razorpay.env stored ABOVE public_html (never web-accessible).
header('Content-Type: application/json');

function fail($code, $msg) { http_response_code($code); echo json_encode(['success' => false, 'error' => $msg]); exit; }

$envFile = dirname(__DIR__, 2) . '/razorpay.env'; // public_html/api -> up two = folder containing public_html
if (!is_readable($envFile)) fail(500, 'Server not configured');
$env = parse_ini_file($envFile);
$KEY_ID = $env['RAZORPAY_KEY_ID'] ?? '';
$KEY_SECRET = $env['RAZORPAY_KEY_SECRET'] ?? '';
if (!$KEY_ID || !$KEY_SECRET) fail(500, 'Server not configured');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only');
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) fail(400, 'Invalid JSON');
