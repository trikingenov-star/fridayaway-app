// Tiny Upstash Redis client over REST (no dependencies). Env vars come from the Vercel Upstash integration.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL || "";
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN || "";
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
module.exports = { cmd, pipe, ready };
