// "Meal Scan" — customer photographs a meal and gets an ESTIMATE of its
// nutrition (calories, protein, carbs, fat, fiber), a short health verdict,
// practical recommendations, and a few generic fresh-produce suggestions.
//
// Same rule as api/fridge-scan.js: the AI only ever returns plain text and
// generic produce NAMES. Matching those names to real, available catalog
// products (and prices) happens client-side in App.jsx — the AI never
// returns a product ID or price.
//
// Uses Groq's vision model with the same GROQ_API_KEY as api/fridge-scan.js
// and api/ai-recipe.js — no extra setup.

const PROMPT = (lang) => `You are a friendly nutrition assistant for a fresh-produce delivery service. A customer sends a photo of a meal. Estimate its nutrition for the portion visible in the photo.

Respond with ONLY valid JSON, no markdown, no code fences. Exactly this shape:
{
  "dish": string,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "health_score": number,
  "verdict": string,
  "tips": [string, ...],
  "add_produce": [string, ...]
}

Rules:
- "dish" is a short name of what you see. Write ALL text fields (dish, verdict, tips) in ${lang === "ar" ? "Arabic" : "English"}.
- Numbers are realistic ESTIMATES for the visible portion. Round calories to the nearest 10 and grams to the nearest whole number.
- "health_score" is an integer 1-10 (10 = very balanced and nutritious).
- "verdict" is ONE short sentence on how balanced the meal looks.
- "tips" has 2 to 3 short, practical, encouraging recommendations (e.g. add vegetables, swap an ingredient, watch the portion). No medical claims, no diagnosing, no diet-shaming.
- "add_produce" has 0 to 4 simple generic English fruit or vegetable names that would improve this meal (e.g. "spinach", "cucumber", "tomato", "lemon"). Always English, lowercase, no brands.
- If the photo does not clearly show food, respond with exactly: {"error": "unclear"}`;

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { imageBase64, lang } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image/")) {
    res.status(400).json({ error: "Please attach a photo of your meal." }); return;
  }
  if (imageBase64.length > 2_800_000) {
    res.status(400).json({ error: "That photo is too large — please try a smaller image." }); return;
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Meal Scan isn't set up yet — missing API key." }); return; }

  try {
    const body = JSON.stringify({
      model: "qwen/qwen3.6-27b",
      messages: [{ role: "user", content: [
        { type: "text", text: PROMPT(lang === "ar" ? "ar" : "en") },
        { type: "image_url", image_url: { url: imageBase64 } },
      ] }],
      response_format: { type: "json_object" },
      max_completion_tokens: 900,
      temperature: 0.2,
    });
    const call = () => fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body,
    });
    let aiRes = await call();
    if (aiRes.status === 503 || aiRes.status === 429) { await new Promise((r) => setTimeout(r, 800)); aiRes = await call(); }
    if (!aiRes.ok) {
      console.error("Groq meal-scan error:", aiRes.status, await aiRes.text());
      res.status(502).json({ error: "Couldn't read that photo right now — please try again." }); return;
    }
    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content;
    let parsed;
    try { parsed = JSON.parse(String(raw || "").replace(/```json|```/g, "").trim()); }
    catch { res.status(502).json({ error: "Sorry, we couldn't read that photo. Try a clearer, well-lit shot." }); return; }

    if (parsed && parsed.error === "unclear") {
      res.status(200).json({ error: "We couldn't clearly see a meal in that photo. Try a closer, well-lit shot from above." }); return;
    }
    // Validate and clamp — never trust model output blindly.
    const num = (v, max) => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.round(n))) : null; };
    const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const out = {
      dish: str(parsed?.dish, 80),
      calories: num(parsed?.calories, 5000),
      protein_g: num(parsed?.protein_g, 400),
      carbs_g: num(parsed?.carbs_g, 800),
      fat_g: num(parsed?.fat_g, 400),
      fiber_g: num(parsed?.fiber_g, 150),
      health_score: Math.max(1, Math.min(10, num(parsed?.health_score, 10) || 5)),
      verdict: str(parsed?.verdict, 240),
      tips: (Array.isArray(parsed?.tips) ? parsed.tips : []).map((t) => str(t, 220)).filter(Boolean).slice(0, 3),
      add_produce: [...new Set((Array.isArray(parsed?.add_produce) ? parsed.add_produce : []).map((t) => str(t, 40).toLowerCase()).filter(Boolean))].slice(0, 4),
    };
    if (!out.dish || out.calories === null) { res.status(502).json({ error: "Sorry, we couldn't read that photo. Try a clearer shot." }); return; }
    res.status(200).json(out);
  } catch (e) {
    console.error("Meal scan handler error:", e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
