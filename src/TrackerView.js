// src/TrackerView.js
import { useState, useEffect, useRef } from "react";
import LiveMap from "./LiveMap";
import { watchDelivery } from "./db";

const STATUS = {
  pending:    { label: "Pendiente",   color: "#94a3b8", icon: "📦" },
  linked:     { label: "Conductor asignado", color: "#f59e0b", icon: "🔗" },
  in_transit: { label: "En camino",   color: "#3b82f6", icon: "🚚" },
  delivered:  { label: "Entregado",   color: "#10b981", icon: "✅" },
};

function Row({ icon, label, time, active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: active ? "#60a5fa" : "#cbd5e1", fontWeight: active ? 700 : 400, fontSize: 13 }}>{label}</div>
        {time && <div style={{ color: "#475569", fontSize: 11 }}>{time}</div>}
      </div>
    </div>
  );
}

export default function TrackerView() {
  // Try to get code from URL param first
  const urlCode = new URLSearchParams(window.location.search).get("code");
  const [inputCode, setInputCode] = useState(urlCode || "");
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState("");
  const unsubRef = useRef(null);

  useEffect(() => {
    if (urlCode) track(urlCode);
  }, []);

  const track = (code) => {
    code = (code || inputCode).trim().toUpperCase();
    if (!code) { setError("Ingresa el código de seguimiento."); return; }
    setError("");
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = watchDelivery(code, (data) => {
      if (!data) { setError("Código no encontrado."); return; }
      setDelivery(data);
    });
  };

  useEffect(() => () => { if (unsubRef.current) unsubRef.current(); }, []);

  const s = STATUS[delivery?.status || "pending"];

  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ background: "#0f172a", padding: "20px 20px 16px", borderBottom: "2px solid #10b981" }}>
        <div style={{ color: "#6ee7b7", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 }}>SEGUIMIENTO</div>
        <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 700 }}>
          {delivery ? <>Pedido <span style={{ fontFamily: "monospace", color: "#10b981" }}>{delivery.code}</span></> : "Rastrear Pedido"}
        </div>
        {delivery?.label?.to?.name && <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Para: {delivery.label.to.name}</div>}
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Buscar */}
        {!urlCode && (
          <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 10 }}>CÓDIGO DE SEGUIMIENTO</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())} placeholder="Ej: A3F7K2" maxLength={6}
                onKeyDown={e => e.key === "Enter" && track()}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 16, fontFamily: "monospace", letterSpacing: 4, textAlign: "center", outline: "none" }} />
              <button onClick={() => track()}
                style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Buscar
              </button>
            </div>
            {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</div>}
          </div>
        )}

        {delivery && (
          <>
            {/* Estado */}
            <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, textAlign: "center", border: `1.5px solid ${s.color}40` }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ color: s.color, fontWeight: 800, fontSize: 22 }}>{s.label}</div>
              {delivery.lastUpdate && <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>Actualizado: {delivery.lastUpdate}</div>}
            </div>

            {/* Dirección */}
            {delivery.label?.to && (
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
                <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>DIRECCIÓN DE ENTREGA</div>
                <div style={{ color: "#f8fafc", fontWeight: 600 }}>{delivery.label.to.name}</div>
                {delivery.label.to.address && <div style={{ color: "#94a3b8", fontSize: 13 }}>{delivery.label.to.address}</div>}
                {delivery.label.to.city    && <div style={{ color: "#94a3b8", fontSize: 13 }}>{delivery.label.to.city}</div>}
                {delivery.label.to.phone   && <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>✆ {delivery.label.to.phone}</div>}
              </div>
            )}

            {/* Mapa */}
            {delivery.currentPos && delivery.status === "in_transit" && (
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
                <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 10 }}>📍 CONDUCTOR EN VIVO</div>
                <LiveMap lat={delivery.currentPos.lat} lng={delivery.currentPos.lng} trail={delivery.trail || []} />
              </div>
            )}

            {/* Historial */}
            <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>HISTORIAL</div>
              {delivery.createdAt   && <Row icon="📦" label="Pedido creado"           time={`${delivery.createdDate || ""} ${delivery.createdAt}`} />}
              {delivery.linkedAt    && <Row icon="🔗" label="Conductor asignado"      time={delivery.linkedAt} />}
              {delivery.transitAt   && <Row icon="🚚" label="En camino"              time={delivery.transitAt} active={delivery.status === "in_transit"} />}
              {delivery.deliveredAt && <Row icon="✅" label="Entregado"              time={delivery.deliveredAt} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}