const { getDb } = require("../_lib/admin");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function send(res, status, body) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(body);
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).end();
  }

  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });

  try {
    const db = getDb();

    // Load events (all)
    const eventsSnap = await db.collection("events").orderBy("updatedAt", "desc").get();
    const events = [];
    eventsSnap.forEach((d) => events.push({ id: d.id, ...d.data() }));

    // Load orders (limit to 1000 to avoid huge responses)
    const ordersSnap = await db.collection("orders").orderBy("createdAt", "desc").limit(1000).get();
    const orders = [];
    ordersSnap.forEach((d) => orders.push({ id: d.id, ...d.data() }));

    // Load referrals (list)
    const refsSnap = await db.collection("referrals").get();
    const referrals = [];
    refsSnap.forEach((d) => referrals.push({ id: d.id, ...d.data() }));

    return send(res, 200, { events, orders, referrals });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "Failed to load admin data", detail: err?.message || err });
  }
};
