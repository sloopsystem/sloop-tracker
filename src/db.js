// src/db.js
// Reemplaza el storage local por Firebase Realtime Database
// Así conductor y cliente pueden estar en dispositivos distintos

import { db } from "./firebase";
import { ref, set, onValue, off } from "firebase/database";

const ROOT = "deliveries";

// Guarda el estado completo de una entrega en Firebase
export function saveDelivery(delivery) {
  const r = ref(db, `${ROOT}/${delivery.code}`);
  return set(r, delivery);
}

// Escucha cambios en tiempo real de una entrega por código
// onUpdate se llama cada vez que cambia el dato en Firebase
// Devuelve una función para cancelar la suscripción
export function watchDelivery(code, onUpdate) {
  const r = ref(db, `${ROOT}/${code}`);
  onValue(r, (snapshot) => {
    const data = snapshot.val();
    if (data) onUpdate(data);
  });
  return () => off(r);
}

// Escucha TODAS las entregas activas (para el panel de despacho)
export function watchAllDeliveries(onUpdate) {
  const r = ref(db, ROOT);
  onValue(r, (snapshot) => {
    const data = snapshot.val() || {};
    onUpdate(data);
  });
  return () => off(r);
}
