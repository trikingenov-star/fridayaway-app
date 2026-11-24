// GET /api/snapshot?o=MIL&f=..&t=..&a=1   prices pre-calculated overnight (see prewarm.js), or 404
// GET /api/snapshot?kind=promos            active lastminute.com IT offers from Awin (needs AWIN_TOKEN); ?health=1 for a status check
// GET /api/snapshot?kind=deals&o=MIL&a=1   usual (median) cheapest price per city from the nightly history, for "below usual" badges
// (one file on purpose: the Vercel Hobby plan allows at most 12 serverless functions)
const { cmd } = require("./_kv");
const snapHandler = async (req, res) => {
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
const PUB = "3161068", MID = 12374;
const clip = (s, n) => String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const promosHandler = async (req, res) => {
  const q = req.query || {};
  const token = process.env.AWIN_TOKEN;
  res.setHeader("cache-control", "s-maxage=3600, stale-while-revalidate=21600");
  if (!token) { res.setHeader("cache-control", "s-maxage=300"); return res.status(200).json({ promos: [], off: true }); }
  try {
    const r = await fetch(`https://api.awin.com/publisher/${PUB}/promotions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ filters: { advertiserIds: [MID], membership: "joined", status: "active", type: "all", regionCodes: ["IT"] }, pagination: { page: 1, pageSize: 50 } }),
    });
    if (!r.ok) throw new Error("Awin HTTP " + r.status);
    const j = await r.json();
    if (q.all) return res.status(200).json({ total: (j.data || []).length, all: (j.data || []).slice(0, 30).map((p) => ({ title: clip(p.title, 90), desc: clip(p.description, 120), code: clip(p.voucher && p.voucher.code, 30), end: p.endDate || "" })) });
    const now = Date.now(), seen = new Set(), promos = [];
    for (const p of j.data || []) {
      const end = p.endDate ? Date.parse(p.endDate) : 0;
      if (end && end < now) continue;
      const code = clip(p.voucher && p.voucher.code, 40);
      const title = clip(p.title, 90); if (!title) continue;
      const num = (x) => (x ? +x.replace(/[.,]/g, "") : 0), txt = `${p.title} ${p.description} ${p.terms}`;
      const min = num((txt.match(/(?:a partire da|da|from|over)\s*(?:€|eur)?\s*(\d{1,3}(?:[.,]\d{3})+|\d+)/i) || [])[1]), off = num((txt.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(?:€|eur)\s*(?:di sconto|off|discount)/i) || [])[1]);
      const key = (code || title).toLowerCase(); if (seen.has(key)) continue; seen.add(key);
      promos.push({ id: String(p.promotionId || key).slice(0, 24), title, desc: clip(p.description, 160), terms: clip(p.terms, 200), code, min, off, end: end ? new Date(end).toISOString().slice(0, 10) : "" });
    }
    promos.sort((a, b) => (b.code ? 1 : 0) - (a.code ? 1 : 0));
    if (q.health) return res.status(200).json({ ok: true, count: promos.length, withCode: promos.filter((p) => p.code).length });
    return res.status(200).json({ promos: promos.slice(0, 5) });
  } catch (e) {
    res.setHeader("cache-control", "s-maxage=60");
    return res.status(200).json({ promos: [], error: String(e.message || e).slice(0, 80) });
  }
};

const dealsHandler = async (req, res) => {
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

module.exports = (req, res) => {
  const k = String((req.query && req.query.kind) || "");
  if (k === "promos") return promosHandler(req, res);
  if (k === "deals") return dealsHandler(req, res);
  return snapHandler(req, res);
};
