/// src/DriverView.js
import { useState, useEffect, useRef } from "react";
import LiveMap from "./LiveMap";
import QRBlock from "./QRBlock";
import { saveDelivery, watchAllDeliveries, watchConfig } from "./db";

const STATUS = {
  pending:    { label: "Pendiente",   color: "#94a3b8", icon: "📦" },
  linked:     { label: "Vinculado",   color: "#f59e0b", icon: "🔗" },
  in_transit: { label: "En tránsito", color: "#3b82f6", icon: "🚚" },
  delivered:  { label: "Entregado",   color: "#10b981", icon: "✅" },
};

const nowStr = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// ── Load jsQR (works on iOS Safari) ──────────────────────────────────────────
function loadJsQR() {
  return new Promise((res) => {
    if (window.jsQR) return res();
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js";
    s.onload = res;
    document.head.appendChild(s);
  });
}

// ── QR Scanner — compatible with iOS Safari ───────────────────────────────────
function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [status, setStatus] = useState("starting"); // starting | scanning | error

  useEffect(() => {
    let active = true;

    const start = async () => {
      await loadJsQR();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", true);
          await videoRef.current.play();
          setStatus("scanning");
          scan();
        }
      } catch (e) {
        setStatus("error");
      }
    };

    const scan = () => {
      if (!active || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) { rafRef.current = requestAnimationFrame(scan); return; }
      const canvas = canvasRef.current;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
      if (code) { onScan(code.data); return; }
      rafRef.current = requestAnimationFrame(scan);
    };

    start();
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 300, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 16 }}>Escanear QR</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", maxWidth: 480, borderRadius: 12, display: status === "scanning" ? "block" : "none" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {/* Viewfinder overlay */}
        {status === "scanning" && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 220, height: 220, border: "3px solid #60a5fa", borderRadius: 16, boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)", pointerEvents: "none" }} />
        )}
        {status === "starting" && (
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Iniciando cámara…</div>
        )}
        {status === "error" && (
          <div style={{ textAlign: "center", padding: "0 24px" }}>
            <div style={{ color: "#f87171", fontSize: 14, marginBottom: 8 }}>No se pudo acceder a la cámara.</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Ingresa el código manualmente abajo.</div>
          </div>
        )}
      </div>
      {status === "scanning" && (
        <div style={{ padding: "16px 20px", textAlign: "center", color: "#60a5fa", fontSize: 13 }}>
          Apunta la cámara al código QR de la etiqueta
        </div>
      )}
    </div>
  );
}

// ── PIN Modal ─────────────────────────────────────────────────────────────────
function PinModal({ onConfirm, onClose, pin }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const check = () => {
    if (input === pin) { onConfirm(); }
    else { setError("PIN incorrecto"); setInput(""); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#1e293b", borderRadius: 16, padding: 28, width: "100%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Confirmar entrega</div>
        <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>Ingresa el PIN para marcar como entregado</div>
        <input
          type="password" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && check()}
          placeholder="PIN"
          style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 20, textAlign: "center", outline: "none", letterSpacing: 6, marginBottom: 8 }}
        />
        {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: "1.5px solid #334155", background: "none", color: "#94a3b8", fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={check}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Driver View ──────────────────────────────────────────────────────────
export default function DriverView() {
  const [deliveries, setDeliveries] = useState({});
  const [config, setConfig] = useState({});
  const [manualCode, setManualCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showPin, setShowPin] = useState(null); // code to deliver
  const [tracking, setTracking] = useState({}); // { code: true }
  const [error, setError] = useState("");
  const watchIds = useRef({});

  useEffect(() => {
    const u1 = watchAllDeliveries(setDeliveries);
    const u2 = watchConfig(setConfig);
    return () => { u1(); u2(); };
  }, []);

  // My linked deliveries
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
    // Start GPS
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
  };

  const confirmDelivery = (code) => {
    if (watchIds.current[code]) {
      navigator.geolocation.clearWatch(watchIds.current[code]);
      delete watchIds.current[code];
    }
    setTracking(t => { const n = { ...t }; delete n[code]; return n; });
    const d = deliveries[code];
    const updated = { ...d, status: "delivered", deliveredAt: nowStr() };
    saveDelivery(updated);
    setShowPin(null);
  };

  useEffect(() => () => {
    Object.values(watchIds.current).forEach(id => navigator.geolocation.clearWatch(id));
  }, []);

  const pin = config.pin || "1234";

  return (
    <div style={{ padding: "0 0 40px" }}>
      {showScanner && <QRScanner onScan={linkDelivery} onClose={() => setShowScanner(false)} />}
      {showPin && <PinModal pin={pin} onConfirm={() => confirmDelivery(showPin)} onClose={() => setShowPin(null)} />}

      {/* Header */}
      <div style={{ background: "#0f172a", padding: "20px 20px 16px", borderBottom: "2px solid #1e40af" }}>
        <div style={{ color: "#60a5fa", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 }}>PANEL DEL CONDUCTOR</div>
        <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 700 }}>Mis Entregas</div>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Agregar pedido */}
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

        {/* Lista activa */}
        {activeDeliveries.length === 0 && (
          <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, textAlign: "center", color: "#475569" }}>
            No tienes pedidos asignados todavía.
          </div>
        )}

        {activeDeliveries.map(d => (
          <DriverDeliveryCard
            key={d.code}
            delivery={d}
            isTracking={!!tracking[d.code]}
            onStartTransit={() => startTransit(d.code)}
            onDeliver={() => setShowPin(d.code)}
          />
        ))}

        {/* Entregados */}
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
      {/* Info */}
      <div style={{ padding: "14px 14px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 20, color: "#f8fafc", letterSpacing: 3 }}>{code}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isTracking && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "pulse 1.2s infinite" }} />}
            <span style={{ color: s.color, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
          </div>
        </div>
        {to.name && <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: 14 }}>{to.name}</div>}
        {to.address && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{to.address}</div>}
        {to.city    && <div style={{ color: "#94a3b8", fontSize: 12 }}>{to.city}</div>}
        {to.phone   && <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>✆ {to.phone}</div>}
        {to.note    && <div style={{ color: "#f59e0b", fontSize: 12, marginTop: 6 }}>📌 {to.note}</div>}
      </div>

      {/* Mapa */}
      {currentPos && isTracking && (
        <div style={{ padding: "0 14px 10px" }}>
          <LiveMap lat={currentPos.lat} lng={currentPos.lng} trail={trail || []} />
          <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>GPS activo · {lastUpdate}</div>
        </div>
      )}

      {/* Botones */}
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