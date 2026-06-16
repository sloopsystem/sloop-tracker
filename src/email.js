// src/email.js
// Helper para enviar emails via la API serverless de Vercel

export async function sendEmail({ to, type, code, name }) {
  if (!to) return; // Si no hay email, no hacer nada
  try {
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, type, code, name }),
    });
  } catch (err) {
    console.error("Error enviando email:", err);
  }
}