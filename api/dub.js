module.exports = async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY2;

  if (!apiKey) {
    return res.status(500).json({ error: "ELEVENLABS_API_KEY is missing in Vercel." });
  }

  try {
    // 1. Check Dubbing Status
    if (req.method === "GET" && req.query.action === "status") {
      const { id } = req.query;
      const r = await fetch(`https://api.elevenlabs.io/v1/dubbing/${id}`, {
        headers: { "xi-api-key": apiKey }
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // 2. Stream Real Dubbed Video/Audio
    if (req.method === "GET" && req.query.action === "audio") {
      const { id, lang } = req.query;
      const r = await fetch(`https://api.elevenlabs.io/v1/dubbing/${id}/audio/${lang}`, {
        headers: { "xi-api-key": apiKey }
      });
      if (!r.ok) {
        const errText = await r.text();
        return res.status(r.status).send(errText);
      }
      const contentType = r.headers.get("content-type") || "video/mp4";
      const buffer = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", contentType);
      return res.status(200).send(buffer);
    }

    // 3. Start New Real AI Dubbing Job
    if (req.method === "POST") {
      const { sourceUrl, targetLang, fileBase64, fileName, mimeType } = req.body || {};
      if (!targetLang) {
        return res.status(400).json({ error: "targetLang is required" });
      }

      const form = new FormData();
      form.append("target_lang", targetLang);
      form.append("mode", "automatic");
      
form.append("watermark", "true");
      if (fileBase64) {
        const buf = Buffer.from(fileBase64, "base64");
        const blob = new Blob([buf], { type: mimeType || "video/mp4" });
        form.append("file", blob, fileName || "video.mp4");
      } else if (sourceUrl) {
        form.append("source_url", sourceUrl);
      } else {
        return res.status(400).json({ error: "No video file or URL provided" });
      }

      const r = await fetch("https://api.elevenlabs.io/v1/dubbing", {
        method: "POST",
        headers: { "xi-api-key": apiKey },
        body: form
      });

      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
};
