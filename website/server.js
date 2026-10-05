require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const Razorpay = require('razorpay');

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, PORT = 3000 } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env');
  process.exit(1);
}

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

// Fee is set in .env (WORKSHOP_FEE, in rupees) so it can't be changed from the browser.
const WORKSHOP = {
  feeInr: Number(process.env.WORKSHOP_FEE) || 89
};

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Public config for the frontend (KEY_ID only, never the secret)
app.get('/api/config', (req, res) => {
  res.json({
    keyId: RAZORPAY_KEY_ID,
    fee: WORKSHOP.feeInr
  });
});

// STEP 1: create order
app.post('/api/create-order', async (req, res) => {
  const { name, email, phone, workshop } = req.body || {};
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Please fill in all fields.' });
  }
  const amount = WORKSHOP.feeInr * 100; // paise
  if (amount < 100) return res.status(400).json({ error: 'Amount must be at least 100 paise.' });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: 'ws_' + Date.now(),
      notes: { name, email, phone, workshop: String(workshop || 'Workshop').slice(0, 100) }
    });
    res.json({ order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('Razorpay order error:', err.error || err);
    if (err.statusCode === 401) return res.status(401).json({ error: 'Razorpay authentication failed. Check your API keys.' });
    res.status(500).json({ error: 'Could not create the order. Please try again.' });
  }
});

// STEP 3: verify signature
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Missing payment details.' });
  }
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpay_signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(400).json({ success: false, error: 'Payment verification failed.' });
  }
  // Signature is valid: record the registration as paid here (email, sheet, DB, etc.).
  console.log('Payment verified:', razorpay_payment_id, 'for order', razorpay_order_id);
  res.json({ success: true, payment_id: razorpay_payment_id });
});

app.listen(PORT, () => console.log('Running at http://localhost:' + PORT));
