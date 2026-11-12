// POST /api/track  {sid, ev:[{t, ts, d}]}
// Anonymous product analytics: what people do inside Fridayaway (no names, emails or IP addresses are stored).
// Each flush from a browser becomes one small JSON file in the project's Vercel Blob store.
const { cmd, pipe, ready, names } = require("./_kv");
const TYPES = new Set(["open", "search", "swipe", "undo", "sheet", "book", "checkout", "hotel_switch", "fly_filter", "together_start", "together_end", "install", "sight_open", "install_popup", "install_click", "install_choice", "install_close", "lang", "time", "events_open", "book_step", "theme", "hotel_section", "ready", "alert_shown", "alert_signup", "alert_close", "vibe_chip", "reveal"]);
const clean = (d) => {
  if (!d || typeof d !== "object") return undefined;
  const o = {};
  Object.keys(d).slice(0, 14).forEach((k) => {
    const v = d[k];
    if (typeof v === "number" && isFinite(v)) o[k.slice(0, 16)] = Math.round(v * 100) / 100;
    else if (typeof v === "boolean") o[k.slice(0, 16)] = v;
    else if (typeof v === "string") o[k.slice(0, 16)] = v.slice(0, 40);
    else if (Array.isArray(v)) o[k.slice(0, 16)] = v.slice(0, 8).map((x) => String(x).slice(0, 16));
  });
  return o;
};
module.exports = async (req, res) => {
  res.setHeader("cache-control", "no-store");
  if (req.method === "GET" && req.query && req.query.health) {
    // Health check without any user data: how many event batches were stored per day in the last 7 days
    const out = {}; const now = Date.now();
    if (!ready()) return res.status(500).json({ error: "database not configured", seenVariables: names() }); // names only, never values
    try {
      const days = Array.from({ length: 7 }, (_, i) => new Date(now - i * 864e5).toISOString().slice(0, 10));
      const n = await pipe(days.map((d) => ["LLEN", "ev:" + d]));
      days.forEach((d, i) => (out[d] = { files: n[i] }));
      return res.status(200).json(out);
    } catch (e) { return res.status(500).json({ error: String(e.message || e).slice(0, 200) }); }
  }
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const sid = String(b.sid || "").replace(/[^a-z0-9]/gi, "").slice(0, 32);
  if (!sid) return res.status(400).json({ error: "no session" });
  const ev = (Array.isArray(b.ev) ? b.ev : []).slice(0, 300).filter((e) => e && TYPES.has(e.t))
    .map((e) => ({ t: e.t, ts: Number(e.ts) || Date.now(), d: clean(e.d) }));
  if (!ev.length) return res.status(204).end();
  const ua = String(req.headers["user-agent"] || "");
  if (/HeadlessChrome|Playwright|Puppeteer|bot|crawler|spider/i.test(ua)) return res.status(204).end();
  const uid = String(b.uid || "").replace(/[^a-z0-9]/gi, "").slice(0, 32);
  const rec = { sid, uid, at: Date.now(), dev: /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop", os: /iPhone|iPad|Mac OS/i.test(ua) ? "Apple" : /Android/i.test(ua) ? "Android" : /Windows/i.test(ua) ? "Windows" : "other", country: String(req.headers["x-vercel-ip-country"] || ""), ev };
  try {
    const day = new Date().toISOString().slice(0, 10);
    await pipe([["RPUSH", "ev:" + day, JSON.stringify(rec)], ["SADD", "ev:days", day]]);
    return res.status(204).end();
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e).slice(0, 200) });
  }
};
