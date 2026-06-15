// src/db.js
// Reemplaza el storage local por Firebase Realtime Database
// Así conductor y cliente pueden estar en dispositivos distintos

// src/db.js
import { db } from "./firebase";
import { ref, set, onValue, off, remove } from "firebase/database";

const ROOT = "deliveries";
const CONFIG = "config";

// ── Entregas ──────────────────────────────────────────────────────────────────
export function saveDelivery(delivery) {
  const r = ref(db, `${ROOT}/${delivery.code}`);
  return set(r, delivery);
}

export function deleteDelivery(code) {
  const r = ref(db, `${ROOT}/${code}`);
  return remove(r);
}

export function watchDelivery(code, onUpdate) {
  const r = ref(db, `${ROOT}/${code}`);
  onValue(r, (snap) => { const d = snap.val(); if (d) onUpdate(d); });
  return () => off(r);
}

export function watchAllDeliveries(onUpdate) {
  const r = ref(db, ROOT);
  onValue(r, (snap) => { onUpdate(snap.val() || {}); });
  return () => off(r);
}

// ── Config global (nombre empresa, PIN) ───────────────────────────────────────
export function saveConfig(cfg) {
  return set(ref(db, CONFIG), cfg);
}

export function watchConfig(onUpdate) {
  const r = ref(db, CONFIG);
  onValue(r, (snap) => { onUpdate(snap.val() || {}); });
  return () => off(r);
}

