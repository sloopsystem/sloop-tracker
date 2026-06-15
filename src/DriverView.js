// src/DriverView.js
import { useState, useEffect, useRef } from "react";
import LiveMap from "./LiveMap";
import { saveDelivery, watchDelivery } from "./db";

const STATUS = {
  pending:    { label: "Pendiente",   color: "#94a3b8", icon: "📦" },
  linked:     { label: "Vinculado",   color: "#f59e0b", icon: "🔗" },
  in_transit: { label: "En tránsito", color: "#3b82f6", icon: "🚚" },
  delivered:  { label: "Entregado",   color: "#10b981", icon: "✅" },
};

const nowStr = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function DriverView() {
  const [inputCode, setInputCode] = useState("");
  const [delivery, setDelivery] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | requesting | tracking | denied
  const [error, setError] = useState("");
  const watchId = useRef(null);
  const unsubRef = useRef(null);

  const linked   = delivery?.status !== "pending" && !!delivery;
  const tracking = gpsStatus === "tracking";

  const link = () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) { setError("Ingresa el código."); return; }
    setError("");
    // Suscribirse al código en Firebase
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = watchDelivery(code, (data) => {
      if (!data) { setError("Código no encontrado."); return; }
      setDelivery(data);
      // Marcar como vinculado si aún está pendiente
      if (data.status === "pending") {
        const updated = { ...data, status: "linked", linkedAt: nowStr() };
        setDelivery(updated);
        saveDelivery(updated);
      }
    });
  };

  const startGPS = () => {
    if (!navigator.geolocation) { setError("GPS no disponible en este dispositivo."); return; }
    setGpsStatus("requesting");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsStatus("tracking");
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: nowStr() };
        setDelivery(prev => {
          if (!prev) return prev;
          const trail = [...(prev.trail || []), pt].slice(-50);
          const updated = { ...prev, status: "in_transit", currentPos: pt, trail, lastUpdate: nowStr() };
          saveDelivery(updated);
          return updated;
        });
      },
      (e) => { setGpsStatus("denied"); setError("GPS denegado: " + e.message); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const markDone = () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    setGpsStatus("idle");
    const updated = { ...delivery, status: "delivered", deliveredAt: nowStr() };
    setDelivery(updated);
    saveDelivery(updated);
  };

  useEffect(() => () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    if (unsubRef.current) unsubRef.current();
  }, []);

  const s = STATUS[delivery?.status || "pending"];

  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ background: "#0f172a", padding: "20px 20px 16px", borderBottom: "2px solid #1e40af" }}>
        <div style={{ color: "#60a5fa", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 }}>PANEL DEL CONDUCTOR</div>
        <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 700 }}>Rastreo de Entrega</div>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Estado */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: `1.5px solid ${s.color}30` }}>
          <span style={{ fontSize: 28 }}>{s.icon}</span>
          <div>
            <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>ESTADO ACTUAL</div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{s.label}</div>
          </div>
        </div>

        {/* Destinatario (si está vinculado) */}
        {delivery?.label?.to?.name && (
          <div style={{ background: "#1e293b", borderRadius: 10, padding: "12px 14px", border: "1.5px solid #334155" }}>
            <div style={{ color: "#94a3b8", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>DESTINATARIO</div>
            <div style={{ color: "#f8fafc", fontWeight: 600 }}>{delivery.label.to.name}</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>{delivery.label.to.address}</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>{delivery.label.to.city}</div>
            {delivery.label.to.phone && <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>✆ {delivery.label.to.phone}</div>}
            {delivery.label.notes   && <div style={{ color: "#64748b", fontSize: 11, marginTop: 4, fontStyle: "italic" }}>📌 {delivery.label.notes}</div>}
          </div>
        )}

        {/* Paso 1: vincular */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 16, border: linked ? "1.5px solid #10b98130" : "1.5px solid #f59e0b30" }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 10 }}>PASO 1 — VINCULAR PAQUETE</div>
          {!linked ? (
            <>
              <p style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 12 }}>
                Ingresa el código de la etiqueta para vincular esta entrega a tu dispositivo.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Ej: A3F7K2"
                  maxLength={6}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 16, fontFamily: "monospace", letterSpacing: 4, textAlign: "center", outline: "none" }}
                />
                <button onClick={link}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#0f172a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Vincular
                </button>
              </div>
              {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</div>}
            </>
          ) : (
            <div style={{ color: "#10b981", fontWeight: 600 }}>✅ Vinculado — código: <span style={{ fontFamily: "monospace" }}>{delivery.code}</span></div>
          )}
        </div>

        {/* Paso 2: GPS */}
        {linked && delivery.status !== "delivered" && (
          <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 10 }}>PASO 2 — GPS</div>
            {!tracking ? (
              <>
                <p style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 12 }}>El cliente verá tu ubicación en tiempo real una vez que actives el rastreo.</p>
                <button onClick={startGPS} disabled={gpsStatus === "requesting"}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: gpsStatus === "requesting" ? "#334155" : "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  {gpsStatus === "requesting" ? "Solicitando permiso…" : "📍 Iniciar Rastreo GPS"}
                </button>
                {gpsStatus === "denied" && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</div>}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ color: "#3b82f6", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "pulse 1.2s infinite" }} />
                  GPS activo · {delivery.lastUpdate}
                </div>
                {delivery.currentPos && <LiveMap lat={delivery.currentPos.lat} lng={delivery.currentPos.lng} trail={delivery.trail || []} />}
              </div>
            )}
          </div>
        )}

        {/* Marcar entregado */}
        {linked && delivery.status === "in_transit" && (
          <button onClick={markDone}
            style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            ✅ Marcar como Entregado
          </button>
        )}

        {delivery?.status === "delivered" && (
          <div style={{ background: "#064e3b", borderRadius: 12, padding: 16, border: "1.5px solid #10b981", textAlign: "center" }}>
            <div style={{ fontSize: 32 }}>✅</div>
            <div style={{ color: "#10b981", fontWeight: 700, fontSize: 18 }}>¡Entrega completada!</div>
            <div style={{ color: "#6ee7b7", fontSize: 13, marginTop: 4 }}>Entregado a las {delivery.deliveredAt}</div>
          </div>
        )}
      </div>
    </div>
  );
}
