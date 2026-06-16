// api/send-email.js
// Vercel Serverless Function — intermediario seguro para Resend

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, type, code, name } = req.body;

  if (!to || !type || !code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const trackingUrl = `https://tracking.robustheit.cl?code=${code}`;

  const templates = {
    created: {
      subject: `Tu pedido ${code} ha sido registrado`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <div style="background:#0f172a;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#f8fafc;font-size:22px;margin:0;">Onloop</h1>
          </div>
          <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px;">
            <p style="color:#334155;font-size:16px;">Hola${name ? ` ${name}` : ""},</p>
            <p style="color:#334155;">Tu pedido ha sido registrado con el código:</p>
            <div style="background:#0f172a;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
              <span style="color:#60a5fa;font-family:monospace;font-size:28px;font-weight:900;letter-spacing:6px;">${code}</span>
            </div>
            <p style="color:#334155;">Podrás seguir tu entrega en tiempo real una vez que el conductor la recoja.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${trackingUrl}" style="background:#3b82f6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                Seguir mi pedido
              </a>
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;">O copia este link: ${trackingUrl}</p>
          </div>
        </div>
      `
    },
    in_transit: {
      subject: `Tu pedido ${code} está en camino 🚚`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <div style="background:#0f172a;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#f8fafc;font-size:22px;margin:0;">Onloop</h1>
          </div>
          <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px;">
            <p style="color:#334155;font-size:16px;">Hola${name ? ` ${name}` : ""},</p>
            <p style="color:#334155;">¡Tu pedido <b>${code}</b> está en camino! 🚚</p>
            <p style="color:#334155;">El conductor ya recogió tu paquete y está dirigiéndose a tu dirección.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${trackingUrl}" style="background:#3b82f6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                Ver ubicación en vivo
              </a>
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;">O copia este link: ${trackingUrl}</p>
          </div>
        </div>
      `
    },
    delivered: {
      subject: `Tu pedido ${code} fue entregado ✅`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <div style="background:#0f172a;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#f8fafc;font-size:22px;margin:0;">Onloop</h1>
          </div>
          <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px;">
            <p style="color:#334155;font-size:16px;">Hola${name ? ` ${name}` : ""},</p>
            <p style="color:#334155;">¡Tu pedido <b>${code}</b> fue entregado exitosamente! ✅</p>
            <div style="background:#ecfdf5;border:1.5px solid #10b981;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
              <span style="color:#10b981;font-size:40px;">✅</span>
              <p style="color:#065f46;font-weight:700;margin:8px 0 0;">Entrega completada</p>
            </div>
            <p style="color:#334155;">Gracias por confiar en Onloop.</p>
          </div>
        </div>
      `
    }
  };

  const template = templates[type];
  if (!template) {
    return res.status(400).json({ error: "Invalid email type" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "seguimiento@robustheit.cl",
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}