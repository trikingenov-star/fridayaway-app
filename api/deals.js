// GET /api/deals?o=MIL&a=1  -> per city: usual (median) cheapest flight + hotel price over the last nights, from prewarm.js history.
// The app compares today's price with it and shows "lower than usual" only with at least 5 nights of history.
const { cmd } = require("./_kv");
module.exports = async (req, res) => {
  const q = req.query || {}, o = String(q.o || "MIL").toUpperCase(), a = String(q.a || "1");
  if (!/^[A-Z]{3}$/.test(o) || !/^[1-4]$/.test(a)) return res.status(400).json({ error: "bad request" });
  try {
    const hist = JSON.parse((await cmd(["GET", `ph:${o}-${a}`])) || "{}") || {};
    const out = {};
    for (const [c, h] of Object.entries(hist)) {
      const v = h.map((x) => x[1]).filter((x) => x > 0).sort((x, y) => x - y); if (!v.length) continue;
      out[c] = { usual: v[Math.floor(v.length / 2)], n: v.length };
    }
    res.setHeader("cache-control", "public, s-maxage=3600, stale-while-revalidate=21600");
    return res.status(200).json({ deals: out });
  } catch (e) { res.setHeader("cache-control", "s-maxage=60"); return res.status(200).json({ deals: {} }); }
};
