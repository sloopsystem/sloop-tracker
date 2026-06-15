// src/DispatchView.js
import { useState } from "react";
import QRBlock from "./QRBlock";
import LiveMap from "./LiveMap";
import LabelModal from "./LabelModal";
import printLabel from "./printLabel";
import { saveDelivery } from "./db";

const STATUS = {
  pending:    { label: "Pendiente",   color: "#94a3b8", icon: "📦" },
  linked:     { label: "Vinculado",   color: "#f59e0b", icon: "🔗" },
  in_transit: { label: "En tránsito", color: "#3b82f6", icon: "🚚" },
  delivered:  { label: "Entregado",   color: "#10b981", icon: "✅" },
};

const genCode  = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const nowStr   = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateStr  = () => new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function DispatchView({ delivery, setDelivery }) {
  const [showModal, setShowModal] = useState(false);

  const create = () => {
    const d = { code: genCode(), status: "pending", createdAt: nowStr(), createdDate: dateStr(), trail: [] };
    setDelivery(d);
    saveDelivery(d);
  };

  const reset = () => { setDelivery(null); };

  const saveLabel = (labelData) => {
    const updated = { ...delivery, label: labelData };
    setDelivery(updated);
    saveDelivery(updated);
    setShowModal(false);
  };

  return (
    <div style={{ padding: "0 0 40px" }}>
      {showModal && delivery && (
        <LabelModal delivery={delivery} onSave={saveLabel} onClose={() => setShowModal(false)} />
      )}

      <div style={{ background: "#0f172a", padding: "20px 20px 16px", borderBottom: "2px solid #7c3aed" }}>
        <div style={{ color: "#a78bfa", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 }}>PANEL DE DESPACHO</div>
        <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 700 }}>Crear Entrega</div>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {!delivery ? (
          <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>
              Genera un código único para iniciar una nueva entrega.
            </div>
            <button onClick={create}
              style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              + Nueva Entrega
            </button>
          </div>
        ) : (
          <>
            {/* Etiqueta */}
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 10 }}>🏷 ETIQUETA DE ENVÍO</div>
              <LabelPreview delivery={delivery} onEdit={() => setShowModal(true)} onPrint={() => printLabel(delivery)} />
            </div>

            {/* Estado */}
            <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>ESTADO</div>
              {Object.entries(STATUS).map(([k, v]) => {
                const active = delivery.status === k;
                const past = Object.keys(STATUS).indexOf(k) < Object.keys(STATUS).indexOf(delivery.status);
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, opacity: past || active ? 1 : 0.3 }}>
                    <span style={{ fontSize: 18 }}>{v.icon}</span>
                    <span style={{ color: active ? v.color : past ? "#64748b" : "#475569", fontWeight: active ? 700 : 400, fontSize: 13 }}>{v.label}</span>
                    {active && <span style={{ color: v.color, fontSize: 11, marginLeft: "auto" }}>← actual</span>}
                  </div>
                );
              })}
            </div>

            {/* Mapa live */}
            {delivery.currentPos && delivery.status === "in_transit" && (
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
                <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 10 }}>POSICIÓN EN VIVO</div>
                <LiveMap lat={delivery.currentPos.lat} lng={delivery.currentPos.lng} trail={delivery.trail || []} />
              </div>
            )}

            <button onClick={reset}
              style={{ padding: 10, borderRadius: 8, border: "1.5px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              🗑 Cancelar y crear nueva entrega
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LabelPreview({ delivery, onEdit, onPrint }) {
  const { label = {}, code } = delivery;
  const from = label.from || {}, to = label.to || {};
  const hasData = from.name || to.name;
  return (
    <div style={{ background: "#1e293b", borderRadius: 12, overflow: "hidden", border: "1.5px solid #7c3aed40" }}>
      <div style={{ background: "#f8fafc", padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ background: "#fff", padding: 5, borderRadius: 6, border: "1px solid #e2e8f0", flexShrink: 0 }}>
          <QRBlock value={code} size={72} dark="#0f172a" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 22, color: "#0f172a", letterSpacing: 4 }}>{code}</div>
          {hasData ? (
            <>
              {from.name && <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>DE: <b style={{ color: "#0f172a" }}>{from.name}</b>{from.city ? ` · ${from.city}` : ""}</div>}
              {to.name   && <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>PARA: <b style={{ color: "#0f172a" }}>{to.name}</b>{to.city ? ` · ${to.city}` : ""}</div>}
              {to.address && <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{to.address}</div>}
              {label.notes && <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 3, fontStyle: "italic" }}>📌 {label.notes}</div>}
            </>
          ) : (
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Sin datos — completa la etiqueta</div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", borderTop: "1px solid #e2e8f0" }}>
        <button onClick={onEdit}
          style={{ flex: 1, padding: "11px 0", background: "#1e293b", border: "none", color: "#a78bfa", fontWeight: 600, fontSize: 13, cursor: "pointer", borderRight: "1px solid #334155" }}>
          ✏️ {hasData ? "Editar etiqueta" : "Completar etiqueta"}
        </button>
        <button onClick={onPrint} disabled={!hasData}
          style={{ flex: 1, padding: "11px 0", background: "#1e293b", border: "none", color: hasData ? "#10b981" : "#475569", fontWeight: 600, fontSize: 13, cursor: hasData ? "pointer" : "not-allowed" }}>
          🖨 Imprimir etiqueta
        </button>
      </div>
    </div>
  );
}
