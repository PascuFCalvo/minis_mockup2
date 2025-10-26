const fetch = require("node-fetch");

const API_KEY = process.env.GEMINI_API_KEY;
const API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { images, prompt } = req.body || {};
    if (!images || !Array.isArray(images) || images.length === 0 || !prompt) {
      return res.status(400).json({ error: "Faltan imágenes o prompt" });
    }

    const results = [];
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: imageData.mime_type,
                    data: imageData.base64,
                  },
                },
                {
                  text: `Edita esta imagen: ${prompt}. Devuelve solo la imagen editada.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res
          .status(500)
          .json({ error: errorData.error?.message || response.status });
      }

      const data = await response.json();
      // Extraer la imagen generada
      let edited = null;
      if (data.candidates && data.candidates[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inline_data?.data) edited = part.inline_data.data;
          if (part.inlineData?.data) edited = part.inlineData.data;
        }
      }
      if (edited) {
        results.push({ edited });
      }
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
