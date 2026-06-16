// api/upload-photo.js
// Proxy para subir fotos a Bluehosting desde Vercel
// Evita problemas de CORS en PWA iOS

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image, code } = req.body;

  if (!image || !code) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const response = await fetch("https://robustheit.cl/upload.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, code }),
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : 500).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};