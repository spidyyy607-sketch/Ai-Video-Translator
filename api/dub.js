export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;

  if (req.method === "GET") {
    const action = req.query.action || "status";
    const id = req.query.id || "";
    const lang = req.query.lang || "hi";
    if (action === "status") return res.status(200).json({ status: "dubbed", id, lang });
    if (action === "audio") return res.status(200).json({ ok: true, id, lang });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY missing in Vercel." });

  try {
    const { sourceUrl, targetLang = "hi" } = req.body || {};
    if (!sourceUrl) return res.status(400).json({ error: "sourceUrl is required" });

    const langNames = { hi: "Hindi", en: "English", es: "Spanish", fr: "French", ar: "Arabic", ur: "Urdu" };
    const targetLanguageName = langNames[targetLang] || "Hindi";

    const isBearer = apiKey.startsWith("AQ.");
    const url = isBearer
      ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const headers = { "Content-Type": "application/json" };
    if (isBearer) headers["Authorization"] = `Bearer ${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a video dubbing script writer for TransReel. A user wants to dub this video (${sourceUrl}) into ${targetLanguageName}. Write a clear, natural, engaging voiceover script in ${targetLanguageName} (2 to 3 short sentences, no markdown, no stage directions).`
          }]
        }]
      })
    });

    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: geminiData?.error?.message || "Gemini API request failed."
      });
    }

    const dubbedText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      `यह वीडियो TransReel AI से ${targetLanguageName} में डब किया गया है।`;

    return res.status(200).json({
      dubbing_id: "gem_" + Date.now(),
      status: "dubbed",
      dubbedText,
      targetLang,
      sourceUrl
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
