// src/email.js
export async function sendEmail({ to, type, code, name, receiverName, receiverRut, photoUrl }) {
  if (!to) return;
  try {
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, type, code, name, receiverName, receiverRut, photoUrl }),
    });
  } catch (err) {
    console.error("Error enviando email:", err);
  }
}