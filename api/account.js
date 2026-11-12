// POST /api/account {action, ...}  ->  Fridayaway user accounts (email + password), stored in Redis.
// actions: register {email,password} | login {email,password} | me {token} | logout {token}
//          save {token, saved:[{code,j}]} | alerts {token, on, b, o, a, l}
const { cmd, pipe } = require("./_kv");
const crypto = require("crypto");
const DAY = 86400, SESS_TTL = 180 * DAY;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const scrypt = (pw, salt) => new Promise((ok, ko) => crypto.scrypt(pw, salt, 64, (e, k) => (e ? ko(e) : ok(k.toString("hex")))));
const pub = (u) => ({ email: u.email, saved: u.saved || [], alerts: !!u.alerts, at: u.at });
const cleanSaved = (list) => (Array.isArray(list) ? list : []).slice(0, 80)
  .map((s) => ({ code: String((s && s.code) || "").replace(/[^A-Z]/g, "").slice(0, 3), j: Math.max(0, Math.min(40, Number(s && s.j) || 0)) }))
  .filter((s) => s.code.length === 3);

async function getUser(email) { const raw = await cmd(["GET", "acct:" + email]); try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
const putUser = (u) => cmd(["SET", "acct:" + u.email, JSON.stringify(u)]);
async function newSession(email) { const t = crypto.randomBytes(24).toString("hex"); await cmd(["SET", "sess:" + t, email, "EX", SESS_TTL]); return t; }
async function fromToken(token) {
  const t = String(token || "").replace(/[^a-f0-9]/g, ""); if (t.length !== 48) return null;
  const email = await cmd(["GET", "sess:" + t]); if (!email) return null;
  const u = await getUser(email); return u ? { u, t } : null;
}

module.exports = async (req, res) => {
  res.setHeader("cache-control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  let b = req.body; if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
  const action = String(b.action || "");
  try {
    if (action === "register" || action === "login") {
      const email = String(b.email || "").trim().toLowerCase().slice(0, 120), pw = String(b.password || "");
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "email" });
      if (pw.length < 6 || pw.length > 200) return res.status(400).json({ error: "password" });
      // brute-force guard: at most 10 failed attempts per email every 15 minutes
      const fails = Number(await cmd(["GET", "fail:" + email])) || 0;
      if (fails >= 10) return res.status(429).json({ error: "wait" });
      let u = await getUser(email);
      if (action === "register") {
        if (u) return res.status(409).json({ error: "exists" });
        const salt = crypto.randomBytes(16).toString("hex");
        u = { email, salt, hash: await scrypt(pw, salt), at: Date.now(), saved: cleanSaved(b.saved), alerts: false, src: String(b.g || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) };
        const ok = await cmd(["SET", "acct:" + email, JSON.stringify(u), "NX"]);
        if (!ok) return res.status(409).json({ error: "exists" });
        await cmd(["SADD", "accts", email]);
      } else {
        const good = u && crypto.timingSafeEqual(Buffer.from(await scrypt(pw, u.salt), "hex"), Buffer.from(u.hash, "hex"));
        if (!good) { await pipe([["INCR", "fail:" + email], ["EXPIRE", "fail:" + email, 900]]); return res.status(401).json({ error: u ? "wrong" : "nouser" }); }
        // saves made before logging in on this device are merged into the account
        const add = cleanSaved(b.saved).filter((s) => !(u.saved || []).some((x) => x.code === s.code));
        if (add.length) { u.saved = (u.saved || []).concat(add).slice(0, 80); await putUser(u); }
      }
      return res.status(200).json({ token: await newSession(email), user: pub(u) });
    }
    const s = await fromToken(b.token);
    if (!s) return res.status(401).json({ error: "session" });
    if (action === "me") return res.status(200).json({ user: pub(s.u) });
    if (action === "logout") { await cmd(["DEL", "sess:" + s.t]); return res.status(204).end(); }
    if (action === "save") { s.u.saved = cleanSaved(b.saved); await putUser(s.u); return res.status(204).end(); }
    if (action === "alerts") {
      s.u.alerts = !!b.on; await putUser(s.u);
      if (s.u.alerts) {
        const rec = { email: s.u.email, budget: Math.max(0, Math.min(5000, Number(b.b) || 0)), origin: String(b.o || "MIL").replace(/[^A-Z]/g, "").slice(0, 3), adults: Math.max(1, Math.min(4, Number(b.a) || 1)),
          lang: b.l === "it" ? "it" : "en", source: "account", uid: String(b.uid || "").replace(/[^a-z0-9]/gi, "").slice(0, 32), at: Date.now(), consent: true, test: b.t === true };
        await cmd(["HSET", "subs", s.u.email, JSON.stringify(rec)]);
      } else await cmd(["HDEL", "subs", s.u.email]);
      return res.status(200).json({ user: pub(s.u) });
    }
    return res.status(400).json({ error: "action" });
  } catch (e) { return res.status(500).json({ error: "server" }); }
};
