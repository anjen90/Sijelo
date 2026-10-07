<?php
require __DIR__ . '/_bootstrap.php';

$name = trim($body['name'] ?? ''); $email = trim($body['email'] ?? ''); $phone = trim($body['phone'] ?? '');
if (!$name || !$email || !$phone) fail(400, 'name, email and phone are required');

$amount = 8900; // ₹89 in paise, fixed on the server
if ($amount < 100) fail(400, 'Amount must be at least 100 paise');

$payload = json_encode([
  'amount' => $amount, 'currency' => 'INR', 'receipt' => 'ws_' . time(),
  'notes' => ['name' => $name, 'email' => $email, 'whatsapp' => $phone],
]);
$ch = curl_init('https://api.razorpay.com/v1/orders');
curl_setopt_array($ch, [
  CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_RETURNTRANSFER => true,
  CURLOPT_USERPWD => $KEY_ID . ':' . $KEY_SECRET, CURLOPT_TIMEOUT => 20,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
]);
$res = curl_exec($ch); $status = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);

if ($res === false) fail(500, 'Could not reach Razorpay');
$order = json_decode($res, true);
if ($status === 401) fail(401, 'Razorpay authentication failed');
if ($status !== 200 || empty($order['id'])) fail(500, 'Could not create order');

echo json_encode(['order_id' => $order['id'], 'amount' => $order['amount'], 'currency' => $order['currency'], 'key_id' => $KEY_ID]);
