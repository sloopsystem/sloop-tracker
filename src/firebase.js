// src/firebase.js
// ─────────────────────────────────────────────────────────────────
// INSTRUCCIONES:
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto (ej: "onloop-tracker")
// 3. Ve a Configuración del proyecto → Tus apps → Agrega app web (</>)
// 4. Copia los valores y pégalos aquí abajo
// 5. En Firebase, activa Realtime Database:
//    Build → Realtime Database → Create database → Start in test mode
// ─────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey:            "AIzaSyBadrkf6noKDg3oobprXNv9lPR4ucAqydw",
  authDomain:        "sloop-tracker.firebaseapp.com",
  databaseURL:       "https://sloop-tracker-default-rtdb.firebaseio.com",
  projectId:         "sloop-tracker",
  storageBucket:     "sloop-tracker.firebasestorage.app",
  messagingSenderId: "1023240684429",
  appId:             "1:1023240684429:web:86e3de7abd7563e19bf3c4",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
