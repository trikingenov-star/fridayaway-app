// Fridayaway – server-side proxy to the public lastminute.com MCP server.
// The browser calls POST /api/lm {tool, args, sid}; this function speaks MCP (Streamable HTTP) to lastminute.com
// and returns {payload, sid}. The MCP session id is handed back to the browser so that multi-step tools
// (select_hotel_options → generate_booking_link → get_alternative_flights → change_flight) share one session.

const { callTool, openSession, ENDPOINT, rpc } = require("./_mcp");
const ALLOWED = new Set(["search_flight_and_hotel_package","select_hotel_options","generate_booking_link","create_cart","create_checkout_link","get_alternative_flights","change_flight","search_flights"]);

module.exports = async (req, res) => {
  res.setHeader("cache-control", "no-store");
  try {
    if (req.method === "GET") {
      // Health check: /api/lm?test=1 runs one small real search
      if (req.query && req.query.test) {
        const d = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
        const d2 = new Date(Date.now() + 12 * 864e5).toISOString().slice(0, 10);
        const t0 = Date.now();
        const r = await callTool("search_flight_and_hotel_package", { origin: "MIL", destination: "BCN", date_from: d, date_to: d2, adults: "2", max_results: 2, lang: "it", sort: "recommended" });
        const list = (r.payload && r.payload.products_summary) || [];
        return res.status(200).json({ ok: !!list.length, ms: Date.now() - t0, endpoint: ENDPOINT, error: r.error || null, sample: list.slice(0, 2).map((x) => ({ name: x.name, price_total: x.price_total })) });
      }
      // Diagnostics: /api/lm?tools=1 lists the server's tools (name + input schema of the cart tool);
      // /api/lm?probe=1 runs search -> select -> cart once and reports the SHAPE of the answers (no secrets).
      if (req.query && req.query.tools) {
        const sid = await openSession();
        const { msg } = await rpc({ jsonrpc: "2.0", id: 7, method: "tools/list" }, sid);
        const tl = (msg && msg.result && msg.result.tools) || [];
        return res.status(200).json({ tools: tl.map((t) => t.name), cart: tl.filter((t) => /cart|booking/i.test(t.name)).map((t) => ({ name: t.name, schema: t.inputSchema })) });
      }
      if (req.query && req.query.probe) {
        const d = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10), d2 = new Date(Date.now() + 12 * 864e5).toISOString().slice(0, 10);
        const a = await callTool("search_flight_and_hotel_package", { origin: "MIL", destination: "PMI", date_from: d, date_to: d2, adults: "1", max_results: 1, lang: "it", sort: "recommended" });
        const h = a.payload && (a.payload.products_summary || [])[0];
        if (!h) return res.status(200).json({ step: "search", error: a.error || "no hotels" });
        const b = await callTool("select_hotel_options", { search_id: a.payload.search_id, hotel_internal_id: h.internal_id_hotel, date_from: d, date_to: d2 }, a.sid);
        const room = b.payload && (b.payload.room_options || [])[0];
        if (!room) return res.status(200).json({ step: "select", error: b.error || "no rooms" });
        const c = await callTool("generate_booking_link", { pricing_id: b.payload.pricing_id, rate_id: room.rate_id }, a.sid);
        const shape = (o, dep) => (o && typeof o === "object" && dep < 3 ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? "array(" + v.length + ")" : v && typeof v === "object" ? shape(v, dep + 1) : typeof v === "string" && /^https?:/.test(v) ? "URL" : typeof v])) : typeof o);
        const P = c.payload || {}; const hide = (t) => String(t).replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "<id>").slice(0, 400);
        return res.status(200).json({ step: "cart", error: c.error || null, hasBookingUrl: !!P.booking_url, viaCheckout: !!P._checkout, shape: shape(P, 0), message: hide(P.message || ""), next_steps: (P.next_steps || []).map((x) => hide(typeof x === "string" ? x : JSON.stringify(x))) });
      }
      return res.status(200).json({ ok: true });
    }
    if (req.method !== "POST") return res.status(405).json({ error: { code: "method", message: "POST only" } });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    if (body.init) return res.status(200).json({ sid: await openSession() });
    if (!ALLOWED.has(body.tool)) return res.status(400).json({ error: { code: "tool_error", message: "Tool not allowed" } });
    if (JSON.stringify(body.args || {}).length > 4000) return res.status(400).json({ error: { code: "tool_error", message: "Arguments too large" } });
    const out = await callTool(body.tool, body.args, body.sid);
    return res.status(out.error ? 502 : 200).json(out);
  } catch (e) {
    return res.status(502).json({ error: { code: "server_unavailable", message: String(e.message || e).slice(0, 300) } });
  }
};
