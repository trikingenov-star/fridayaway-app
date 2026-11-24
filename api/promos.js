// GET /api/promos  (GET /api/promos?health=1 for a status check without any offer data)
// Active lastminute.com Italy offers and voucher codes from the Awin Promotions API.
// Needs the AWIN_TOKEN environment variable (Awin > Account > API credentials > Personal Access Token). Without it the app shows no offers.
const PUB = "3161068", MID = 12374;
const clip = (s, n) => String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
module.exports = async (req, res) => {
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
    const now = Date.now(), seen = new Set(), promos = [];
    for (const p of j.data || []) {
      const end = p.endDate ? Date.parse(p.endDate) : 0;
      if (end && end < now) continue;
      const code = clip(p.voucher && p.voucher.code, 40);
      const title = clip(p.title, 90); if (!title) continue;
      const key = (code || title).toLowerCase(); if (seen.has(key)) continue; seen.add(key);
      promos.push({ id: String(p.promotionId || key).slice(0, 24), title, desc: clip(p.description, 160), terms: clip(p.terms, 200), code, end: end ? new Date(end).toISOString().slice(0, 10) : "" });
    }
    promos.sort((a, b) => (b.code ? 1 : 0) - (a.code ? 1 : 0));
    if (q.health) return res.status(200).json({ ok: true, count: promos.length, withCode: promos.filter((p) => p.code).length });
    return res.status(200).json({ promos: promos.slice(0, 5) });
  } catch (e) {
    res.setHeader("cache-control", "s-maxage=60");
    return res.status(200).json({ promos: [], error: String(e.message || e).slice(0, 80) });
  }
};
