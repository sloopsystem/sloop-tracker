# Onloop Tracker 🚚

App de rastreo de despachos en tiempo real con GPS, código QR y etiquetas de envío.

---

## PASO 1 — Configurar Firebase

1. Ve a https://console.firebase.google.com
2. Clic en **"Agregar proyecto"** → ponle nombre (ej: `onloop-tracker`) → Continuar
3. Desactiva Google Analytics si quieres → **Crear proyecto**
4. En el menú lateral, ve a **Build → Realtime Database**
5. Clic en **"Create Database"** → elige región `us-central1` → **"Start in test mode"** → Enable
6. Vuelve a la página principal del proyecto
7. Clic en el ícono `</>` (Web) para agregar una app web
8. Ponle un nombre (ej: `tracker-web`) → **"Register app"**
9. Copia el bloque `firebaseConfig` que aparece

10. Abre el archivo `src/firebase.js` y reemplaza los valores:

```js
const firebaseConfig = {
  apiKey:            "TU_apiKey",
  authDomain:        "TU_authDomain",
  databaseURL:       "TU_databaseURL",   // ← importante, termina en .firebaseio.com
  projectId:         "TU_projectId",
  storageBucket:     "TU_storageBucket",
  messagingSenderId: "TU_messagingSenderId",
  appId:             "TU_appId",
};
```

---

## PASO 2 — Subir a GitHub

1. Ve a https://github.com → **New repository**
2. Nómbralo `onloop-tracker` → **Create repository**
3. En tu computador, abre Terminal y ejecuta:

```bash
cd onloop-tracker
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/onloop-tracker.git
git push -u origin main
```

---

## PASO 3 — Desplegar en Vercel (gratis)

1. Ve a https://vercel.com → **Sign up with GitHub**
2. Clic en **"Add New Project"**
3. Importa tu repositorio `onloop-tracker`
4. Vercel lo detecta como Create React App automáticamente
5. Clic en **Deploy** → en ~2 minutos tienes tu URL

Tu app estará en: `https://onloop-tracker.vercel.app` (o similar)

---

## Cómo editar el código

### Opción A — Desde el navegador (más fácil)
1. Ve a tu repo en GitHub
2. Haz clic en cualquier archivo → ícono del lápiz ✏️
3. Edita → **Commit changes**
4. Vercel re-despliega automáticamente en ~1 minuto

### Opción B — VS Code en tu computador
1. Descarga VS Code: https://code.visualstudio.com
2. En Terminal: `git clone https://github.com/TU_USUARIO/onloop-tracker.git`
3. `cd onloop-tracker && npm install`
4. `npm start` → abre en http://localhost:3000
5. Edita, guarda, y los cambios se ven al instante
6. Para subir: `git add . && git commit -m "cambio" && git push`

### Opción C — GitHub Codespaces (VS Code en el navegador, sin instalar nada)
1. En tu repo de GitHub, clic en **Code → Codespaces → Create codespace**
2. Se abre VS Code en el navegador
3. En la Terminal integrada: `npm install && npm start`

---

## Estructura del proyecto

```
src/
  firebase.js      ← credenciales Firebase (SOLO EDITAR AQUÍ al inicio)
  db.js            ← funciones para leer/escribir en Firebase
  App.js           ← navegación principal entre las 3 vistas
  DispatchView.js  ← panel de despacho (crear entregas, etiqueta)
  DriverView.js    ← panel del conductor (GPS, vincular código)
  TrackerView.js   ← vista del cliente (seguimiento)
  LabelModal.js    ← formulario de datos de envío
  LiveMap.js       ← mapa en tiempo real (OpenStreetMap)
  QRBlock.js       ← generador de QR
  printLabel.js    ← impresión de etiqueta 100x150mm
```

---

## Próximas mejoras (Fase 2)

- [ ] Login para conductores (Firebase Auth)
- [ ] Múltiples entregas simultáneas
- [ ] Notificaciones al cliente por WhatsApp o email
- [ ] Historial de entregas completadas
- [ ] Panel de administración con mapa de todos los conductores
