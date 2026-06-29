// src/DriverView.js
import { useState, useEffect, useRef } from "react";
import LiveMap from "./LiveMap";
import QRBlock from "./QRBlock";
import { saveDelivery, watchAllDeliveries, watchConfig } from "./db";
import { sendEmail } from "./email";

const STATUS = {
  pending:    { label: "Pendiente",   color: "#94a3b8", icon: "📦" },
  linked:     { label: "Vinculado",   color: "#f59e0b", icon: "🔗" },
  in_transit: { label: "En tránsito", color: "#3b82f6", icon: "🚚" },
  delivered:  { label: "Entregado",   color: "#10b981", icon: "✅" },
};

const nowStr = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// ── Load jsQR ─────────────────────────────────────────────────────────────────
function loadJsQR() {
  return new Promise((res) => {
    if (window.jsQR) return res();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    s.onload = res;
    document.head.appendChild(s);
  });
}

// ── QR Scanner ────────────────────────────────────────────────────────────────
function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const activeRef = useRef(true);
  const [status, setStatus] = useState("ready"); // ready | scanning | error

  // This runs ONLY when user taps the button — required for iOS permission
  const activateCamera = async () => {
    setStatus("scanning");
    try {
      await loadJsQR();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().then(() => tick()).catch(() => setStatus("error"));
      };
    } catch (e) {
      setStatus("error");
    }
  };

  const tick = () => {
    if (!activeRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
    if (code && code.data) {
      activeRef.current = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      onScan(code.data);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 300 }}>
      {/* Header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "48px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom,rgba(0,0,0,.8),transparent)" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Escanear QR</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer" }}>✕</button>
      </div>

      {/* Video — always in DOM so iOS can use it */}
      <video ref={videoRef} playsInline muted autoPlay
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: status === "scanning" ? "block" : "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Viewfinder */}
      {status === "scanning" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ width: 250, height: 250, border: "3px solid #60a5fa", borderRadius: 16, boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
        </div>
      )}

      {/* Ready state — button triggers getUserMedia directly */}
      {status === "ready" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 40px" }}>
          <div style={{ fontSize: 56 }}>📷</div>
          <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 18, textAlign: "center" }}>Escanear código QR</div>
          <div style={{ color: "#64748b", fontSize: 13, textAlign: "center" }}>
            Presiona el botón para activar la cámara y apunta al QR de la etiqueta
          </div>
          <button onClick={activateCamera}
            style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Activar cámara
          </button>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 32px" }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ color: "#f87171", fontSize: 14, textAlign: "center" }}>No se pudo acceder a la cámara.</div>
          <div style={{ color: "#64748b", fontSize: 12, textAlign: "center" }}>
            Ve a Configuración → Safari → Cámara → Permitir
          </div>
          <button onClick={activateCamera}
            style={{ padding: "12px 24px", borderRadius: 10, border: "1.5px solid #3b82f6", background: "none", color: "#60a5fa", fontSize: 14, cursor: "pointer" }}>
            Reintentar
          </button>
          <button onClick={onClose}
            style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #334155", background: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>
            Usar código manual
          </button>
        </div>
      )}

      {/* Bottom hint */}
      {status === "scanning" && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 40px", background: "linear-gradient(to top,rgba(0,0,0,.8),transparent)", textAlign: "center", color: "#60a5fa", fontSize: 13 }}>
          Apunta al código QR de la etiqueta
        </div>
      )}
    </div>
  );
}

// ── Delivery Confirmation Modal ───────────────────────────────────────────────
function DeliveryModal({ onConfirm, onClose, pin }) {
  const [step, setStep] = useState("data"); // data | photo | pin
  const [receiverName, setReceiverName] = useState("");
  const [receiverRut, setReceiverRut] = useState("");
  const [photo, setPhoto] = useState(null); // base64
  const [photoFile, setPhotoFile] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const formatRut = (val) => {
    val = val.replace(/[^0-9kK]/g, "").toUpperCase();
    if (val.length > 1) val = val.slice(0, -1) + "-" + val.slice(-1);
    return val;
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);

    // Compress image before storing as base64
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      // Compress to JPEG at 70% quality
      setPhoto(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = url;
  };

  const goToPin = () => {
    if (!receiverName.trim()) { setError("Ingresa el nombre de quien recibe."); return; }
    if (!receiverRut.trim() || receiverRut.length < 5) { setError("Ingresa un RUT válido."); return; }
    if (!photo) { setError("Debes tomar una foto de la entrega."); return; }
    setError("");
    setStep("pin");
  };

  const confirm = async () => {
    if (pinInput !== pin) { setError("PIN incorrecto."); setPinInput(""); return; }
    setUploading(true);
    setError("");

    // Upload photo via Vercel proxy to Bluehosting
    let photoUrl = null;
    try {
      const resp = await fetch("/api/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo, code: Date.now().toString() }),
      });
      const data = await resp.json();
      if (data.url) photoUrl = data.url;
    } catch (e) {
      console.error("Error subiendo foto:", e);
    }

    setUploading(false);
    onConfirm({ receiverName, receiverRut, photoUrl });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#1e293b", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: "24px 20px 36px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}>CONFIRMAR ENTREGA</div>
            <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>
              {step === "data" ? "Datos del receptor" : step === "photo" ? "Foto de entrega" : "PIN de confirmación"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 24, cursor: "pointer" }}>✕</button>
        </div>

        {/* Step 1: Data */}
        {step === "data" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Nombre de quien recibe *</div>
              <input value={receiverName} onChange={e => setReceiverName(e.target.value)}
                placeholder="Juan Pérez"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 14, outline: "none" }} />
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>RUT *</div>
              <input value={receiverRut} onChange={e => setReceiverRut(formatRut(e.target.value))}
                placeholder="12.345.678-9"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 14, outline: "none" }} />
            </div>

            {/* Photo */}
            <div>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Foto de la entrega *</div>
              <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
              {!photo ? (
                <button onClick={() => inputRef.current?.click()}
                  style={{ width: "100%", padding: "14px", borderRadius: 8, border: "1.5px dashed #334155", background: "none", color: "#60a5fa", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  📷 Tomar foto de la entrega
                </button>
              ) : (
                <div style={{ position: "relative" }}>
                  <img src={photo} alt="entrega" style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }} />
                  <button onClick={() => { setPhoto(null); setPhotoFile(null); }}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)", border: "none", color: "#fff", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 14 }}>
                    ✕
                  </button>
                </div>
              )}
            </div>

            {error && <div style={{ color: "#f87171", fontSize: 12 }}>{error}</div>}

            <button onClick={goToPin}
              style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2: PIN */}
        {step === "pin" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>Ingresa el PIN para confirmar la entrega</div>

            {/* Summary */}
            <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", marginBottom: 16, textAlign: "left" }}>
              <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>RECEPTOR</div>
              <div style={{ color: "#f8fafc", fontWeight: 600 }}>{receiverName}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{receiverRut}</div>
            </div>

            <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && confirm()}
              placeholder="PIN"
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 20, textAlign: "center", outline: "none", letterSpacing: 6, marginBottom: 8 }}
            />
            {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setStep("data"); setError(""); setPinInput(""); }}
                style={{ flex: 1, padding: 12, borderRadius: 8, border: "1.5px solid #334155", background: "none", color: "#94a3b8", fontWeight: 600, cursor: "pointer" }}>
                ← Volver
              </button>
              <button onClick={confirm} disabled={uploading}
                style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: uploading ? "#334155" : "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {uploading ? "Subiendo…" : "✅ Confirmar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Install PWA Banner ────────────────────────────────────────────────────────
function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredRef = useRef(null);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setIsIOS(ios);
    if (!standalone) {
      if (ios) {
        setShow(true);
      } else {
        window.addEventListener("beforeinstallprompt", (e) => {
          e.preventDefault();
          deferredRef.current = e;
          setShow(true);
        });
      }
    }
  }, []);

  if (!show) return null;

  const install = () => {
    if (deferredRef.current) {
      deferredRef.current.prompt();
      deferredRef.current.userChoice.then(() => setShow(false));
    }
  };

  return (
    <div style={{ background: "#1e3a5f", border: "1px solid #3b82f6", borderRadius: 10, padding: "12px 14px", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: 13 }}>📲 Instala la app para usar la cámara</div>
        {isIOS ? (
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 3 }}>
            Toca <b style={{ color: "#60a5fa" }}>Compartir</b> → <b style={{ color: "#60a5fa" }}>Agregar a pantalla de inicio</b>
          </div>
        ) : (
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 3 }}>Instala para mejor experiencia con cámara</div>
        )}
      </div>
      {!isIOS && (
        <button onClick={install}
          style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
          Instalar
        </button>
      )}
      <button onClick={() => setShow(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer", padding: 2 }}>✕</button>
    </div>
  );
}

// ── Main Driver View ──────────────────────────────────────────────────────────
export default function DriverView() {
  const [deliveries, setDeliveries] = useState({});
  const [config, setConfig] = useState({});
  const [manualCode, setManualCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showPin, setShowPin] = useState(null);
  const [tracking, setTracking] = useState({});
  const [error, setError] = useState("");
  const watchIds = useRef({});

  useEffect(() => {
    const u1 = watchAllDeliveries(setDeliveries);
    const u2 = watchConfig(setConfig);
    return () => { u1(); u2(); };
  }, []);

  const myDeliveries = Object.values(deliveries).filter(d =>
    d.status === "linked" || d.status === "in_transit" || d.status === "delivered"
  );
  const activeDeliveries = myDeliveries.filter(d => d.status !== "delivered");
  const doneDeliveries   = myDeliveries.filter(d => d.status === "delivered");

  const linkDelivery = (code) => {
    code = code.trim().toUpperCase();
    if (!code) { setError("Ingresa un código."); return; }
    const d = deliveries[code];
    if (!d) { setError("Código no encontrado."); return; }
    if (d.status !== "pending") { setError("Este pedido ya fue vinculado."); return; }
    setError("");
    const updated = { ...d, status: "linked", linkedAt: nowStr() };
    saveDelivery(updated);
    setManualCode("");
    setShowScanner(false);
  };

  const startTransit = (code) => {
    const d = deliveries[code];
    if (!d) return;
    if (!navigator.geolocation) { alert("GPS no disponible."); return; }
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: nowStr() };
        setDeliveries(prev => {
          const cur = prev[code];
          if (!cur) return prev;
          const trail = [...(cur.trail || []), pt].slice(-50);
          const updated = { ...cur, status: "in_transit", currentPos: pt, trail, lastUpdate: nowStr() };
          saveDelivery(updated);
          return { ...prev, [code]: updated };
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    watchIds.current[code] = wid;
    setTracking(t => ({ ...t, [code]: true }));
    const updated = { ...d, status: "in_transit", transitAt: nowStr() };
    saveDelivery(updated);
    // Email al cliente
    if (d.label?.to?.email) {
      sendEmail({ to: d.label.to.email, type: "in_transit", code, name: d.label.to.name });
    }
  };

  const confirmDelivery = (code, receiverData) => {
    if (watchIds.current[code]) {
      navigator.geolocation.clearWatch(watchIds.current[code]);
      delete watchIds.current[code];
    }
    setTracking(t => { const n = { ...t }; delete n[code]; return n; });
    const d = deliveries[code];
    const updated = { 
      ...d, 
      status: "delivered", 
      deliveredAt: nowStr(),
      receiver: receiverData,
    };
    saveDelivery(updated);
    // Email al cliente
    if (d.label?.to?.email) {
      sendEmail({ 
        to: d.label.to.email, 
        type: "delivered", 
        code, 
        name: d.label.to.name,
        receiverName: receiverData.receiverName,
        receiverRut: receiverData.receiverRut,
        photoUrl: receiverData.photoUrl,
      });
    }
    setShowPin(null);
  };

  useEffect(() => () => {
    Object.values(watchIds.current).forEach(id => navigator.geolocation.clearWatch(id));
  }, []);

  const pin = config.pin || "1234";

  return (
    <div style={{ padding: "0 0 40px" }}>
      {showScanner && <QRScanner onScan={linkDelivery} onClose={() => setShowScanner(false)} />}
      {showPin && <DeliveryModal pin={pin} onConfirm={(data) => confirmDelivery(showPin, data)} onClose={() => setShowPin(null)} />}

      <div style={{ background: "#0f172a", padding: "20px 20px 16px", borderBottom: "2px solid #1e40af" }}>
        <div style={{ color: "#60a5fa", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 }}>PANEL DEL CONDUCTOR</div>
        <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 700 }}>Mis Entregas</div>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>

        <InstallBanner />

        <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 10 }}>AGREGAR PEDIDO</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} placeholder="Código manual" maxLength={6}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 15, fontFamily: "monospace", letterSpacing: 4, textAlign: "center", outline: "none" }} />
            <button onClick={() => linkDelivery(manualCode)}
              style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#0f172a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Agregar
            </button>
          </div>
          <button onClick={() => setShowScanner(true)}
            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #334155", background: "none", color: "#60a5fa", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            📷 Escanear QR
          </button>
          {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</div>}
        </div>

        {activeDeliveries.length === 0 && (
          <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, textAlign: "center", color: "#475569" }}>
            No tienes pedidos asignados todavía.
          </div>
        )}

        {activeDeliveries.map(d => (
          <DriverDeliveryCard key={d.code} delivery={d}
            isTracking={!!tracking[d.code]}
            onStartTransit={() => startTransit(d.code)}
            onDeliver={() => setShowPin(d.code)}
          />
        ))}

        {doneDeliveries.length > 0 && (
          <div>
            <div style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>COMPLETADOS</div>
            {doneDeliveries.map(d => (
              <div key={d.code} style={{ background: "#1e293b", borderRadius: 10, padding: "12px 14px", marginBottom: 8, opacity: 0.5, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#f8fafc" }}>{d.code}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{d.label?.to?.name} · {d.deliveredAt}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DriverDeliveryCard({ delivery, isTracking, onStartTransit, onDeliver }) {
  const { code, status, label = {}, currentPos, trail, lastUpdate } = delivery;
  const to = label.to || {};
  const s = STATUS[status] || STATUS.pending;

  return (
    <div style={{ background: "#1e293b", borderRadius: 12, overflow: "hidden", border: `1.5px solid ${s.color}30` }}>
      <div style={{ padding: "14px 14px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 20, color: "#f8fafc", letterSpacing: 3 }}>{code}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isTracking && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "pulse 1.2s infinite" }} />}
            <span style={{ color: s.color, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
          </div>
        </div>
        {to.name    && <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: 14 }}>{to.name}</div>}
        {to.address && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{to.address}</div>}
        {to.city    && <div style={{ color: "#94a3b8", fontSize: 12 }}>{to.city}</div>}
        {to.phone   && <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>✆ {to.phone}</div>}
        {to.note    && <div style={{ color: "#f59e0b", fontSize: 12, marginTop: 6 }}>📌 {to.note}</div>}
      </div>
      {currentPos && isTracking && (
        <div style={{ padding: "0 14px 10px" }}>
          <LiveMap lat={currentPos.lat} lng={currentPos.lng} trail={trail || []} />
          <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>GPS activo · {lastUpdate}</div>
        </div>
      )}
      <div style={{ display: "flex", borderTop: "1px solid #334155" }}>
        {status === "linked" && (
          <button onClick={onStartTransit}
            style={{ flex: 1, padding: "13px 0", border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            🚚 En camino
          </button>
        )}
        {status === "in_transit" && (
          <button onClick={onDeliver}
            style={{ flex: 1, padding: "13px 0", border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ✅ Marcar Entregado
          </button>
        )}
      </div>
    </div>
  );
}