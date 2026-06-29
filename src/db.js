// src/db.js
// API MySQL en Bluehosting — reemplaza Firebase

const API = "https://robustheit.cl/tracker-api";

// ── Entregas ──────────────────────────────────────────────────────────────────

export async function saveDelivery(delivery) {
  await fetch(`${API}/deliveries.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(delivery),
  });
}

export async function deleteDelivery(code) {
  await fetch(`${API}/deliveries.php?code=${code}`, { method: "DELETE" });
}

export async function getDelivery(code) {
  const res = await fetch(`${API}/deliveries.php?code=${code}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getAllDeliveries() {
  const res = await fetch(`${API}/deliveries.php`);
  if (!res.ok) return {};
  return res.json();
}

// Polling — llama onUpdate cada X ms con los datos actuales
export function watchDelivery(code, onUpdate, interval = 3000) {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch(`${API}/deliveries.php?code=${encodeURIComponent(code)}`);
      if (res.status === 404) {
        onUpdate(null);
      } else if (res.ok) {
        const data = await res.json();
        onUpdate(data);
      }
    } catch (_) {}
    if (active) setTimeout(poll, interval);
  };
  poll();
  return () => { active = false; };
}

export function watchAllDeliveries(onUpdate, interval = 3000) {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const data = await getAllDeliveries();
      onUpdate(data);
    } catch (_) {}
    if (active) setTimeout(poll, interval);
  };
  poll();
  return () => { active = false; };
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function saveConfig(cfg) {
  await fetch(`${API}/config.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
}

export function watchConfig(onUpdate, interval = 5000) {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch(`${API}/config.php`);
      const data = await res.json();
      onUpdate(data);
    } catch (_) {}
    if (active) setTimeout(poll, interval);
  };
  poll();
  return () => { active = false; };
}