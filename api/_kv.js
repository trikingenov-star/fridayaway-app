// Tiny Upstash Redis client over REST (no dependencies). Env vars come from the Vercel Upstash integration.
// Vercel's Upstash integration may add a custom prefix to the variable names, so look for them by suffix too.
const env = process.env;
const find = (re, not) => { const k = Object.keys(env).find((n) => re.test(n) && !(not && not.test(n)) && env[n]); return k ? env[k] : ""; };
const URL_ = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || env.REDIS_REST_URL || find(/REST_API_URL$|REDIS_REST_URL$|REST_URL$/i);
const TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || env.REDIS_REST_TOKEN || find(/REST_API_TOKEN$|REDIS_REST_TOKEN$|REST_TOKEN$/i, /READ_ONLY/i);
const ready = () => !!(URL_ && TOKEN);
async function cmd(args) {
  if (!ready()) throw new Error("database not configured");
  const r = await fetch(URL_, { method: "POST", headers: { authorization: "Bearer " + TOKEN, "content-type": "application/json" }, body: JSON.stringify(args) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || "db " + r.status);
  return j.result;
}
async function pipe(list) {
  if (!ready()) throw new Error("database not configured");
  const r = await fetch(URL_ + "/pipeline", { method: "POST", headers: { authorization: "Bearer " + TOKEN, "content-type": "application/json" }, body: JSON.stringify(list) });
  const j = await r.json().catch(() => []);
  if (!r.ok || !Array.isArray(j)) throw new Error("db " + r.status);
  return j.map((x) => { if (x.error) throw new Error(x.error); return x.result; });
}
module.exports = { cmd, pipe, ready, names: () => Object.keys(env).filter((n) => /KV|UPSTASH|REDIS|STORAGE/i.test(n)) };
