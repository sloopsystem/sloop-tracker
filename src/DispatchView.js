// src/DispatchView.js
import { useState, useEffect } from "react";
import QRBlock from "./QRBlock";
import LiveMap from "./LiveMap";
import LabelModal from "./LabelModal";
import printLabel from "./printLabel";
import { saveDelivery, deleteDelivery, watchAllDeliveries, watchConfig, saveConfig } from "./db";

const STATUS = {
  pending:    { label: "Pendiente",   color: "#94a3b8", icon: "📦" },
  linked:     { label: "Vinculado",   color: "#f59e0b", icon: "🔗" },
  in_transit: { label: "En tránsito", color: "#3b82f6", icon: "🚚" },
  delivered:  { label: "Entregado",   color: "#10b981", icon: "✅" },
};

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const nowStr  = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateStr = () => new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function DispatchView() {
  const [deliveries, setDeliveries] = useState({});
  const [config, setConfig] = useState({});
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    const u1 = watchAllDeliveries(setDeliveries);
    const u2 = watchConfig(cfg => { setConfig(cfg); setNewPin(cfg.pin || "1234"); });
    return () => { u1(); u2(); };
  }, []);

  const delivery = selected ? deliveries[selected] : null;

  const create = () => {
    const d = { code: genCode(), status: "pending", createdAt: nowStr(), createdDate: dateStr(), trail: [] };
    saveDelivery(d);
    setSelected(d.code);
  };

  const remove = (code) => {
    deleteDelivery(code);
    if (selected === code) setSelected(null);
  };

  const saveLabel = (labelData) => {
    const updated = { ...delivery, label: labelData };
    saveDelivery(updated);
    setShowModal(false);
  };

  const savePin = () => {
    if (newPin.length < 4) return;
    saveConfig({ ...config, pin: newPin });
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2000);
  };

  const activeList = Object.values(deliveries).filter(d => d.status !== "delivered");
  const doneList   = Object.values(deliveries).filter(d => d.status === "delivered");

  return (
    <div style={{ padding: "0 0 40px" }}>
      {showModal && delivery && <LabelModal delivery={delivery} onSave={saveLabel} onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div style={{ background: "#0f172a", padding: "20px 20px 16px", borderBottom: "2px solid #7c3aed", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#a78bfa", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 }}>PANEL DE DESPACHO</div>
          <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 700 }}>Entregas</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowConfig(!showConfig)}
            style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #334155", background: "none", color: "#94a3b8", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            ⚙️
          </button>
          <button onClick={create}
            style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            + Nueva
          </button>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: 16 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>⚙️ CONFIGURACIÓN</div>
          <div style={{ marginBottom: 4, color: "#64748b", fontSize: 11 }}>PIN del conductor (mín. 4 dígitos)</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="1234"
              style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 16, textAlign: "center", letterSpacing: 6, outline: "none" }} />
            <button onClick={savePin}
              style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: pinSaved ? "#10b981" : "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {pinSaved ? "✓ Guardado" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 16px 0" }}>

        {activeList.length === 0 && (
          <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
            <div style={{ color: "#94a3b8", fontSize: 14 }}>No hay entregas activas. Crea una nueva.</div>
          </div>
        )}

        {activeList.map(d => (
          <DeliveryCard key={d.code} delivery={d} selected={selected === d.code}
            onSelect={() => setSelected(selected === d.code ? null : d.code)}
            onEdit={() => { setSelected(d.code); setShowModal(true); }}
            onPrint={() => printLabel(d)}
            onDelete={() => remove(d.code)}
          />
        ))}

        {doneList.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>COMPLETADOS HOY</div>
            {doneList.map(d => (
              <DeliveryCard key={d.code} delivery={d} done
                selected={selected === d.code}
                onSelect={() => setSelected(selected === d.code ? null : d.code)}
                onDelete={() => remove(d.code)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryCard({ delivery, selected, onSelect, onEdit, onPrint, onDelete, done }) {
  const { code, status, label = {}, currentPos, trail, lastUpdate } = delivery;
  const s = STATUS[status] || STATUS.pending;
  const to = label.to || {};

  return (
    <div style={{ background: "#1e293b", borderRadius: 12, marginBottom: 12, overflow: "hidden", border: selected ? `1.5px solid ${s.color}` : "1.5px solid #334155", opacity: done ? 0.6 : 1 }}>
      <div onClick={onSelect} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{ background: "#fff", padding: 4, borderRadius: 6, flexShrink: 0 }}>
          <QRBlock value={code} size={48} dark="#0f172a" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 18, color: "#f8fafc", letterSpacing: 3 }}>{code}</div>
          {to.name
            ? <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>→ {to.name}{to.city ? ` · ${to.city}` : ""}</div>
            : <div style={{ color: "#475569", fontSize: 12, marginTop: 2 }}>Sin destinatario — completa la etiqueta</div>
          }
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18 }}>{s.icon}</div>
          <div style={{ color: s.color, fontSize: 11, fontWeight: 600 }}>{s.label}</div>
        </div>
      </div>

      {selected && (
        <div style={{ borderTop: "1px solid #334155" }}>
          {to.note && (
            <div style={{ padding: "8px 14px", background: "#0f172a40", borderBottom: "1px solid #334155" }}>
              <span style={{ color: "#f59e0b", fontSize: 11 }}>📌 </span>
              <span style={{ color: "#94a3b8", fontSize: 12, fontStyle: "italic" }}>{to.note}</span>
            </div>
          )}
          {currentPos && status === "in_transit" && (
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #334155" }}>
              <div style={{ color: "#94a3b8", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>📍 EN VIVO · {lastUpdate}</div>
              <LiveMap lat={currentPos.lat} lng={currentPos.lng} trail={trail || []} />
            </div>
          )}
          {!done && (
            <div style={{ display: "flex" }}>
              <button onClick={onEdit}
                style={{ flex: 1, padding: "10px 0", background: "none", border: "none", color: "#a78bfa", fontWeight: 600, fontSize: 12, cursor: "pointer", borderRight: "1px solid #334155" }}>
                ✏️ Etiqueta
              </button>
              <button onClick={onPrint} disabled={!to.name}
                style={{ flex: 1, padding: "10px 0", background: "none", border: "none", color: to.name ? "#10b981" : "#475569", fontWeight: 600, fontSize: 12, cursor: to.name ? "pointer" : "default", borderRight: "1px solid #334155" }}>
                🖨 Imprimir
              </button>
              <button onClick={onDelete}
                style={{ flex: 1, padding: "10px 0", background: "none", border: "none", color: "#f87171", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                🗑 Eliminar
              </button>
            </div>
          )}
          {done && (
            <button onClick={onDelete}
              style={{ width: "100%", padding: "10px 0", background: "none", border: "none", color: "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              🗑 Eliminar registro
            </button>
          )}
        </div>
      )}
    </div>
  );
}