// GET /api/snapshot?o=MIL&f=YYYY-MM-DD&t=YYYY-MM-DD&a=1  -> prices pre-calculated overnight (see prewarm.js), or 404
const { cmd } = require("./_kv");
module.exports = async (req, res) => {
  const q = req.query || {};
  const o = String(q.o || "").toUpperCase(), f = String(q.f || ""), t = String(q.t || ""), a = String(q.a || "");
  if (!/^[A-Z]{3}$/.test(o) || !/^\d{4}-\d{2}-\d{2}$/.test(f) || !/^\d{4}-\d{2}-\d{2}$/.test(t) || !/^[1-4]$/.test(a)) return res.status(400).json({ error: "bad request" });
  try {
    const raw = await cmd(["GET", `snap:${o}-${f}-${t}-${a}`]);
    if (!raw) { res.setHeader("cache-control", "s-maxage=300"); return res.status(404).json({ error: "none" }); }
    const j = JSON.parse(raw);
    if (!j || Date.now() - j.at > 30 * 3600e3) { res.setHeader("cache-control", "s-maxage=300"); return res.status(404).json({ error: "old" }); }
    res.setHeader("cache-control", "public, s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).json({ results: j.results, at: j.at });
  } catch (e) { return res.status(500).json({ error: "snapshot failed" }); }
};
