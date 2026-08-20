// "Fridge Scan" — customer photographs their fridge/pantry, this identifies
// the food ingredients visible in the photo. Returns ONLY a plain list of
// generic ingredient names — never a product ID, never a price, never a
// purchasable item directly. Matching against Darousha's real, active
// product catalog and the RECIPES library happens entirely client-side in
// App.jsx, same non-negotiable rule as the text-based recipe assistant.
//
// Uses Groq's vision-capable model (qwen/qwen3.6-27b), same free-tier
// account/API key as api/ai-recipe.js — no separate setup needed if that's
// already configured. As of August 2026 this model is in Preview on Groq;
// if it's ever deprecated, swap the model string the same way ai-recipe.js
// was updated when llama-3.3-70b-versatile was retired.
//
// SETUP: same GROQ_API_KEY environment variable as api/ai-recipe.js.

const SYSTEM_PROMPT = `You are a kitchen vision assistant for a grocery delivery service. A customer sends a photo of their fridge, pantry, or kitchen counter. Your only job is to identify the distinct food ingredients you can clearly see.

Respond with ONLY valid JSON, no markdown, no code fences, no commentary. Use exactly this shape:
{
  "ingredients": [string, ...]
}

Rules:
- Each ingredient name must be simple and generic (e.g. "tomato", "milk", "cheese", "onion", "eggs") — no brand names, no packaging descriptions, no guessing at exact quantities.
- Only list items you can actually see with reasonable confidence — do not guess at what might be behind other items or out of frame.
- List at most 30 ingredients.
- Do not include non-food items (containers, shelves, appliances) in the list.
- If the photo doesn't clearly show food or kitchen items, respond with exactly: {"error": "unclear"}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { imageBase64 } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image/")) {
    res.status(400).json({ error: "Please attach a photo to scan." });
    return;
  }
  // Guard against oversized payloads — base64 images have a lower size limit
  // on Groq's vision endpoint than URL-based images, and large uploads slow
  // everything down regardless. ~2MB of base64 text is a generous ceiling
  // for a compressed JPEG at the resolution this feature actually needs.
  if (imageBase64.length > 2_800_000) {
    res.status(400).json({ error: "That photo is too large — please try a smaller or more compressed image." });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "The fridge scanner isn't set up yet — missing API key." });
    return;
  }

  try {
    const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    const groqBody = JSON.stringify({
      model: "qwen/qwen3.6-27b",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SYSTEM_PROMPT },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 800,
      temperature: 0.2,
    });

    async function callGroq() {
      return fetch(groqUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqBody,
      });
    }

    let aiRes = await callGroq();
    if (aiRes.status === 503 || aiRes.status === 429) {
      await new Promise((r) => setTimeout(r, 800));
      aiRes = await callGroq();
    }

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Groq vision API error:", aiRes.status, errText);
      res.status(502).json({ error: "Couldn't read that photo right now — please try again." });
      return;
    }

    const data = await aiRes.json();
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) {
      res.status(502).json({ error: "Sorry, we couldn't read that photo." });
      return;
    }

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      res.status(502).json({ error: "Sorry, we couldn't read that photo. Try a clearer, well-lit shot." });
      return;
    }

    if (parsed && parsed.error === "unclear") {
      res.status(200).json({ error: "We couldn't clearly identify food in that photo. Try a clearer shot of your fridge or pantry shelf." });
      return;
    }

    // Never trust the AI's output blindly — validate and strip to an allow-listed shape.
    if (!parsed || !Array.isArray(parsed.ingredients)) {
      res.status(502).json({ error: "Sorry, we couldn't read that photo. Try a clearer, well-lit shot." });
      return;
    }

    const cleanIngredients = parsed.ingredients
      .filter((i) => typeof i === "string" && i.trim().length > 0)
      .slice(0, 30)
      .map((i) => i.trim().toLowerCase().slice(0, 40));

    // Dedupe
    const uniqueIngredients = [...new Set(cleanIngredients)];

    if (uniqueIngredients.length === 0) {
      res.status(200).json({ error: "We couldn't clearly identify any ingredients in that photo. Try a clearer shot." });
      return;
    }

    res.status(200).json({ ingredients: uniqueIngredients });
  } catch (e) {
    console.error("Fridge scan handler error:", e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
