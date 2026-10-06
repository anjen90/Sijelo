const cors = require("./_cors");

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return res.status(500).json({ error: "Server not configured" });

  const { name, email, phone } = req.body || {};
  if (!name || !email || !phone) return res.status(400).json({ error: "name, email and phone are required" });

  const amount = 8900; // ₹89 in paise, fixed on the server
  if (amount < 100) return res.status(400).json({ error: "Amount must be at least 100 paise" });

  try {
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET).toString("base64"),
      },
      body: JSON.stringify({ amount, currency: "INR", receipt: "ws_" + Date.now(), notes: { name, email, whatsapp: phone } }),
    });
    const order = await r.json();
    if (r.status === 401) return res.status(401).json({ error: "Razorpay authentication failed" });
    if (!r.ok || !order.id) { console.error(order); return res.status(500).json({ error: "Could not create order" }); }
    res.status(200).json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: RAZORPAY_KEY_ID });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not reach Razorpay" });
  }
};
