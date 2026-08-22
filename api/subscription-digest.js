// Runs automatically every morning via Vercel Cron (see vercel.json) — this
// is what makes subscriptions reliable, since the in-app logic previously
// only ever ran when someone happened to have Backstage open. This function
// now does the actual order creation itself, on Vercel's servers, whether
// or not anyone is logged in — then sends one WhatsApp digest of what it
// created. The client-side version in App.jsx (processDueSubscriptions)
// is left in place as a harmless backup: if this cron already created
// today's order for a subscription, the client-side check for
// lastOrderCreatedDate skips it, so the two can't double-create an order.
//
// KNOWN LIMITATION: this does not decrement product stock the way a normal
// checkout does — that logic depends on the full hardcoded catalog living
// in App.jsx, which isn't available to this server function. Stock counts
// won't reflect subscription orders until that's ported over separately.
//
// SETUP REQUIRED before this works (see full instructions at the bottom):
//   1. Generate a Firebase service account key and set it as the
//      FIREBASE_SERVICE_ACCOUNT_KEY environment variable in Vercel.
//   2. That's it — CallMeBot's phone/API key are reused as plain values
//      below since they're already effectively public (shipped in the
//      client bundle today), so there's no added exposure moving them here.

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const CALLMEBOT_PHONE = "971524786729";
const CALLMEBOT_APIKEY = "8870812";
const STANDARD_DELIVERY_FEE = 15; // AED 50–75 subtotal
const FREE_DELIVERY_OVER = 75; // free above this subtotal
const VAT_RATE = 0.05;
function calcDeliveryFee(subtotal) {
  // Subscriptions always re-order via standard (next-day) delivery, never express.
  if (subtotal <= 0) return 0;
  return subtotal > FREE_DELIVERY_OVER ? 0 : STANDARD_DELIVERY_FEE;
}

function todayISOInDubai() {
  // UAE is UTC+4 year-round, no DST — so this is a fixed offset, not a
  // timezone lookup. Using the calendar date in Dubai, not UTC, matters
  // here since this function runs at 02:00 UTC = 06:00 Dubai, and near
  // midnight UTC the two dates can disagree.
  const now = new Date(Date.now() + 4 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

function nextDeliveryDate(fromDateStr, frequency) {
  const d = new Date(fromDateStr);
  const days = frequency === "biweekly" ? 14 : frequency === "monthly" ? 30 : 7; // default weekly
  d.setDate(d.getDate() + days);
  return d;
}

function sendWhatsApp(text) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(text)}&apikey=${CALLMEBOT_APIKEY}`;
  return fetch(url).catch((e) => console.error("CallMeBot send failed:", e));
}

export default async function handler(req, res) {
  // Vercel Cron requests carry this header; reject anything else so this
  // endpoint can't be used by a stranger who finds the URL to spam-create
  // orders or spam your own WhatsApp.
  if (req.headers["x-vercel-cron"] !== "1" && process.env.NODE_ENV !== "development") {
    return res.status(401).json({ error: "Not a scheduled invocation" });
  }

  try {
    if (!getApps().length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();

    const today = todayISOInDubai();
    const snap = await db.collection("subscriptions").where("status", "==", "active").get();
    const due = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => s.lastOrderCreatedDate !== today && new Date(s.nextDeliveryDate) <= new Date());

    if (due.length === 0) {
      // Deliberately silent on a no-subscriptions-due day — a WhatsApp at
      // 6am saying "nothing today" every single day would get muted fast.
      return res.status(200).json({ created: 0 });
    }

    const created = [];
    for (const sub of due) {
      const subtotal = sub.items.reduce((s, it) => s + it.qty * it.price, 0);
      const deliveryFee = calcDeliveryFee(subtotal);
      const vat = Math.round((subtotal + deliveryFee) * VAT_RATE * 100) / 100;
      const order = {
        id: "DF" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
        createdAt: new Date().toISOString(),
        customer: {
          name: sub.customerName, phone: sub.customerPhone, address: sub.customerAddress, area: sub.customerArea,
          date: today, slot: sub.customerSlot, payment: "cod", leaveAtDoor: sub.leaveAtDoor,
          uid: sub.uid, subscriptionId: sub.id,
        },
        items: sub.items,
        subtotal, discount: 0, pointsRedeemed: 0, pointsEarned: 0, deliveryFee, vat,
        total: subtotal + deliveryFee + vat,
        status: "placed",
      };
      await db.collection("orders").doc(order.id).set(order);
      await db.collection("subscriptions").doc(sub.id).set(
        { lastOrderCreatedDate: today, nextDeliveryDate: nextDeliveryDate(today, sub.frequency).toISOString() },
        { merge: true }
      );
      created.push({ sub, order });
    }

    const lines = created.map(({ sub, order }) => `• ${sub.customerName} — ${sub.items?.[0]?.name || "box"} (${sub.customerArea || sub.customerAddress || "no address on file"}) — AED ${order.total.toFixed(2)}`);
    const message = `🔔 ${created.length} subscription order${created.length > 1 ? "s" : ""} created for today (${today}):\n\n${lines.join("\n")}\n\nAlready in your Orders list, ready to prepare.`;
    await sendWhatsApp(message);

    return res.status(200).json({ created: created.length });
  } catch (err) {
    console.error("subscription-digest failed:", err);
    return res.status(500).json({ error: String(err) });
  }
}
