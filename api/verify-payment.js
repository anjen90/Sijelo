const crypto = require("crypto");
const cors = require("./_cors");

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(500).json({ success: false, error: "Server not configured" });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return res.status(400).json({ success: false, error: "Missing payment fields" });

  const expected = crypto.createHmac("sha256", secret).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
    return res.status(400).json({ success: false, error: "Invalid signature" });

  // TODO: save the registration here (email / Google Sheet / database). Payment is verified.
  res.status(200).json({ success: true, payment_id: razorpay_payment_id });
};
