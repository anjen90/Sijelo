// Only your site may call these endpoints from a browser.
const ALLOWED = (process.env.ALLOWED_ORIGINS || "https://sijeloacademy.com,https://www.sijeloacademy.com")
  .split(",").map(s => s.trim());

module.exports = function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).end(); return true; }
  if (req.method !== "POST") { res.status(405).json({ success: false, error: "POST only" }); return true; }
  return false;
};
