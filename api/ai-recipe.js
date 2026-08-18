/ "What do you want to cook?" — turns a free-text request like "chicken shawarma
// for 4" into a structured ingredient list. This function NEVER returns product
// IDs, prices, or anything purchasable directly — only { name, quantity, unit }
// per ingredient. The actual matching against Darousha's real, active product
// catalog happens entirely client-side in App.jsx, using data that's already
// public (the storefront itself). This keeps the non-negotiable rule enforced:
// the AI can never invent or price a purchasable product — only the existing
// catalog can.
//
// Uses Google's Gemini API, which has a genuinely free tier (no credit card
// required) — plenty for this low-volume use case (one short request per
// customer search).
//
// SETUP REQUIRED before this works:
//   1. Go to https://aistudio.google.com/apikey → sign in with any Google
//      account → "Create API key" → copy it (no credit card needed).
//   2. In Vercel → this project → Settings → Environment Variables, add:
//        GEMINI_API_KEY = <your key>  (apply to Production)
//   3. Redeploy.

const VALID_UNITS = ["gram", "piece", "ml", "bunch"];

const SYSTEM_PROMPT = `You are a recipe assistant for a grocery delivery service. A customer describes a meal they want to cook. Your only job is to figure out the ingredients and realistic quantities needed for the stated number of servings — you do NOT know what the store actually sells, so never mention prices, brands, or specific products/brands.

Respond with ONLY valid JSON, no markdown, no code fences, no commentary. Use exactly this shape:
{
  "recipe_name": string,
  "servings": number,
  "ingredients": [
    { "name": string, "quantity": number, "unit": "gram" | "piece" | "ml" | "bunch" }
  ]
}

Rules:
- "name" must be a simple, generic ingredient name (e.g. "tomato", "chicken breast", "olive oil", "parsley") — no brand names, no "fresh"/"organic" qualifiers.
- Use "gram" for solids naturally measured by weight, "ml" for liquids, "piece" for whole countable items (lemons, onions, cucumbers), "bunch" for herbs typically sold in bunches (parsley, mint, cilantro, dill).
- Do not include salt, pepper, or water as ingredients.
- If servings aren't specified, assume 4.
- List at most 15 ingredients.
- If the request doesn't describe an actual meal or dish, respond with exactly: {"error": "unclear"}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { query } = req.body || {};
  if (!query || typeof query !== "string" || query.trim().length < 3) {
    res.status(400).json({ error: "Tell us a little more about what you'd like to cook." });
    return;
  }
  const safeQuery = query.trim().slice(0, 300);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "The recipe builder isn't set up yet — missing API key." });
    return;
  }

  try {
    const aiRes = await fetch(
      https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey},
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: safeQuery }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1000 },
        }),
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Gemini API error:", aiRes.status, errText);
      res.status(502).json({ error: "Couldn't reach the recipe assistant right now — please try again." });
      return;
    }

    const data = await aiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      res.status(502).json({ error: "Sorry, we couldn't build that recipe." });
      return;
    }

    let parsed;
    try {
      const cleaned = rawText.replace(/json|/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      res.status(502).json({ error: "Sorry, we couldn't build that recipe. Try something like 'Fattoush for 4'." });
      return;
    }

    if (parsed && parsed.error === "unclear") {
      res.status(200).json({ error: "Tell us a little more about what you'd like to cook." });
      return;
    }

    // Never trust the AI's output blindly — validate and strip to an allow-listed shape.
    if (
      !parsed ||
      typeof parsed.recipe_name !== "string" ||
      typeof parsed.servings !== "number" ||
      !Array.isArray(parsed.ingredients) ||
      parsed.ingredients.length === 0
    ) {
      res.status(502).json({ error: "Sorry, we couldn't build that recipe. Try something like 'Fattoush for 4'." });
      return;
    }

    const cleanIngredients = parsed.ingredients
      .filter((ing) => ing && typeof ing.name === "string" && typeof ing.quantity === "number" && VALID_UNITS.includes(ing.unit))
      .slice(0, 20)
      .map((ing) => ({
        name: ing.name.trim().toLowerCase().slice(0, 60),
        quantity: Math.max(0, Math.min(ing.quantity, 100000)),
        unit: ing.unit,
      }));

    if (cleanIngredients.length === 0) {
      res.status(502).json({ error: "Sorry, we couldn't build that recipe. Try something like 'Fattoush for 4'." });
      return;
    }

    res.status(200).json({
      recipe_name: parsed.recipe_name.trim().slice(0, 80),
      servings: Math.max(1, Math.min(Math.round(parsed.servings), 50)),
      ingredients: cleanIngredients,
    });
  } catch (e) {
    console.error("AI recipe handler error:", e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
-
