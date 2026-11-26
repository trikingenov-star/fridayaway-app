// GET /api/snapshot?o=MIL&f=..&t=..&a=1   prices pre-calculated overnight (see prewarm.js), or 404
// GET /api/snapshot?kind=promos            active lastminute.com IT offers from Awin (needs AWIN_TOKEN); ?health=1 for a status check
// GET /api/snapshot?kind=deals&o=MIL&a=1   usual (median) cheapest price per city from the nightly history, for "below usual" badges
// GET /api/snapshot?kind=exp&c=LIS&n=Lisbon     top Viator experiences (needs VIATOR_API_KEY)
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

/* GET /api/snapshot?kind=exp&c=LIS&n=Lisbon&l=it   top Viator experiences for a destination (needs VIATOR_API_KEY).
   Works with a sandbox or a production key: production is tried first, sandbox on 401/403 (or force with VIATOR_ENV). ?health=1 adds debug info. */
const VX_BASE = { prod: "https://api.viator.com/partner", sandbox: "https://api.sandbox.viator.com/partner" };
let vxEnv = null, vxDest = null;
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
async function vxCall(env, path, lang, body) {
  const r = await fetch(VX_BASE[env] + path, { method: body ? "POST" : "GET", headers: { "exp-api-key": process.env.VIATOR_API_KEY, accept: "application/json;version=2.0", "accept-language": lang === "it" ? "it-IT" : "en-US", "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  return { s: r.status, j };
}
async function vx(path, lang, body, dbg) {
  const forced = String(process.env.VIATOR_ENV || "").toLowerCase();
  const order = forced.startsWith("prod") ? ["prod"] : forced.startsWith("sand") ? ["sandbox"] : vxEnv ? [vxEnv] : ["prod", "sandbox"];
  let last;
  for (const env of order) {
    last = await vxCall(env, path, lang, body); dbg.push(env + " " + path + " " + last.s);
    if (last.s >= 200 && last.s < 300) { vxEnv = env; return { env, j: last.j }; }
    if (last.s !== 401 && last.s !== 403) break;
  }
  const e = new Error("viator " + (last ? last.s : "?")); e.body = last && last.j; throw e;
}
async function vxDestId(c, n, dbg) {
  const k = `vd:${c}`;
  const hit = await cmd(["GET", k]).catch(() => null); if (hit) return hit;
  if (!vxDest) {
    let list = [];
    try { const { j } = await vx("/destinations", "en", null, dbg); list = (j && j.destinations) || []; } catch (e) { dbg.push("v2 destinations failed"); }
    if (!list.length) { const { j } = await vx("/v1/taxonomy/destinations", "en", null, dbg); list = ((j && j.data) || []).map((d) => ({ destinationId: d.destinationId, name: d.destinationName, type: d.destinationType, iataCodes: d.iataCode ? [d.iataCode] : [] })); }
    vxDest = list;
  }
  const rank = { CITY: 0, REGION: 1, COUNTRY: 3 }, pick = (arr) => arr.sort((a, b) => (rank[a.type] ?? 2) - (rank[b.type] ?? 2))[0];
  let d = pick(vxDest.filter((x) => (x.iataCodes || x.iataCode && [x.iataCode] || []).includes(c)));
  const names = [n.split(/\s*[(&]/)[0], (n.match(/\(([^)]+)\)/) || [])[1]].filter(Boolean).map(norm);
  for (const nm of names) { if (d) break; d = pick(vxDest.filter((x) => norm(x.name) === nm)); }
  const id = d ? String(d.destinationId) : "";
  if (id) await cmd(["SET", k, id, "EX", 30 * 86400]).catch(() => {});
  return id;
}
const expHandler = async (req, res) => {
  const q = req.query || {}, c = String(q.c || "").toUpperCase(), n = String(q.n || "").slice(0, 60), l = q.l === "it" ? "it" : "en", dbg = [];
  if (!/^[A-Z]{3}$/.test(c) || !n) return res.status(400).json({ error: "bad request" });
  if (!process.env.VIATOR_API_KEY) return res.status(200).json({ items: [], off: true });
  const ck = `vx2:${c}:${l}`;
  try {
    if (!q.health) { const hit = await cmd(["GET", ck]).catch(() => null); if (hit) { res.setHeader("cache-control", "public, s-maxage=3600, stale-while-revalidate=86400"); return res.status(200).json(JSON.parse(hit)); } }
    const dest = await vxDestId(c, n, dbg);
    if (!dest) { res.setHeader("cache-control", "s-maxage=3600"); return res.status(200).json({ items: [], err: "no destination", ...(q.health ? { dbg } : {}) }); }
    const { env, j } = await vx("/products/search", l, { filtering: { destination: dest }, sorting: { sort: "DEFAULT" }, pagination: { start: 1, count: 10 }, currency: "EUR" }, dbg);
    const items = ((j && j.products) || []).map((p) => {
      const im = (p.images || []).find((x) => x.isCover) || (p.images || [])[0] || {};
      const v = (im.variants || []).filter((x) => x.width >= 300).sort((a, b) => a.width - b.width)[0] || (im.variants || []).slice(-1)[0] || {};
      const rv = p.reviews || {}, pr = p.pricing && p.pricing.summary || {};
      let u = String(p.productUrl || ""); if (u) u += (u.includes("?") ? "&" : "?") + "campaign=fa_vx_" + c;
      return { id: String(p.productCode || ""), t: clip(p.title, 90), img: v.url || "", p: Math.round(pr.fromPrice || 0), r: +rv.combinedAverageRating || 0, n: rv.totalReviews || 0, u };
    }).filter((x) => x.u && x.img && /^https:\/\//.test(x.u)).slice(0, 8);
    const out = { items, env, dest };
    if (items.length) await cmd(["SET", ck, JSON.stringify(out), "EX", 86400]).catch(() => {});
    res.setHeader("cache-control", items.length ? "public, s-maxage=3600, stale-while-revalidate=86400" : "s-maxage=300");
    return res.status(200).json(q.health ? { ...out, dbg, raw: (j && j.totalCount) } : out);
  } catch (e) {
    res.setHeader("cache-control", "s-maxage=120");
    return res.status(200).json({ items: [], err: String(e.message), ...(q.health ? { dbg, body: e.body && JSON.stringify(e.body).slice(0, 300) } : {}) });
  }
};

/* GET /api/snapshot?kind=img&u=<url>   same-origin copy of a photo (Unsplash or hotel images only),
   so /post.html can draw it on a canvas and export PNG slides. */
const IMG_HOSTS = new Set(["images.unsplash.com", "hotels.staticroot.com"]);
const imgHandler = async (req, res) => {
  let u;
  try { u = new URL(String(req.query.u || "")); } catch (e) { return res.status(400).end("bad url"); }
  if (u.protocol !== "https:" || !IMG_HOSTS.has(u.hostname)) return res.status(400).end("host not allowed");
  try {
    const r = await fetch(u.href, { headers: { "user-agent": "fridayaway/1.0" } });
    const ct = r.headers.get("content-type") || "";
    if (!r.ok || !ct.startsWith("image/")) return res.status(502).end("upstream " + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4000000) return res.status(413).end("too big");
    res.setHeader("content-type", ct);
    res.setHeader("cache-control", "public, s-maxage=2592000, max-age=86400");
    return res.status(200).send(buf);
  } catch (e) { return res.status(502).end("fetch failed"); }
};

module.exports = (req, res) => {
  const k = String((req.query && req.query.kind) || "");
  if (k === "img") return imgHandler(req, res);
  if (k === "promos") return promosHandler(req, res);
  if (k === "deals") return dealsHandler(req, res);
  if (k === "exp") return expHandler(req, res);
  return snapHandler(req, res);
};
