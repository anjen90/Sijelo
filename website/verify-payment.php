<?php
require __DIR__ . '/_bootstrap.php';

$oid = $body['razorpay_order_id'] ?? ''; $pid = $body['razorpay_payment_id'] ?? ''; $sig = $body['razorpay_signature'] ?? '';
if (!$oid || !$pid || !$sig) fail(400, 'Missing payment fields');

$expected = hash_hmac('sha256', $oid . '|' . $pid, $KEY_SECRET);
if (!hash_equals($expected, $sig)) fail(400, 'Invalid signature');

// TODO: save the registration here (database / email / Google Sheet). Payment is verified.
echo json_encode(['success' => true, 'payment_id' => $pid]);
