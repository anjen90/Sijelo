// Only your site may call these endpoints from a browser.
const DEFAULTS = ["https://sijeloacademy.com", "https://www.sijeloacademy.com"];
const extra = (process.env.ALLOWED_ORIGINS || "").split(",");
const clean = o => o.trim().replace(/\/+$/, "").toLowerCase();
const ALLOWED = [...DEFAULTS, ...extra].map(clean).filter(Boolean);

module.exports = function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED.includes(clean(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") { res.status(204).end(); return true; }
  if (req.method !== "POST") { res.status(405).json({ success: false, error: "POST only" }); return true; }
  return false;
};
