require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, PORT = 3000 } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env");
  process.exit(1);
}

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
const FEE_PAISE = 8900; // ₹89, fixed on the server so the client can't change it

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Public key only (safe for the browser)
app.get("/api/config", (req, res) => res.json({ key_id: RAZORPAY_KEY_ID }));

app.post("/api/create-order", async (req, res) => {
  const { name, email, phone } = req.body || {};
  if (!name || !email || !phone) return res.status(400).json({ error: "name, email and phone are required" });
  if (FEE_PAISE < 100) return res.status(400).json({ error: "Amount must be at least 100 paise" });

  try {
    const order = await razorpay.orders.create({
      amount: FEE_PAISE,
      currency: "INR",
      receipt: "ws_" + Date.now(),
      notes: { name, email, whatsapp: phone },
    });
    res.json({ order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    const status = err && err.statusCode === 401 ? 401 : 500;
    console.error("create-order failed:", err && err.error ? err.error : err);
    res.status(status).json({ error: status === 401 ? "Razorpay authentication failed" : "Could not create order" });
  }
});

app.post("/api/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: "Missing payment fields" });
  }
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpay_signature));
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!valid) return res.status(400).json({ success: false, error: "Invalid signature" });

  // TODO: save the registration here (sheet/DB/email) — payment is verified.
  res.json({ success: true, payment_id: razorpay_payment_id });
});

app.listen(PORT, () => console.log("Running at http://localhost:" + PORT));
