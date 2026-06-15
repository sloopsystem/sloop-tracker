// src/LabelModal.js
import { useState } from "react";

export default function LabelModal({ delivery, onSave, onClose }) {
  const [form, setForm] = useState({
    from:  { name: "", address: "", city: "", phone: "" },
    to:    { name: "", address: "", city: "", phone: "" },
    notes: "",
    ...(delivery.label || {}),
  });

  const set = (side, field, val) =>
    setForm(f => ({ ...f, [side]: { ...f[side], [field]: val } }));

  const Field = ({ label, side, field, placeholder }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>{label}</div>
      <input
        value={form[side][field]}
        onChange={e => set(side, field, e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 13, outline: "none" }}
      />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#1e293b", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", padding: "24px 20px 36px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#a78bfa", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}>DATOS DE ETIQUETA</div>
            <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>
              Código: <span style={{ fontFamily: "monospace", color: "#7c3aed" }}>{delivery.code}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 24, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 14px 4px", marginBottom: 12 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>📤 REMITENTE</div>
          <Field label="Nombre / Empresa" side="from" field="name"    placeholder="Onloop SpA" />
          <Field label="Dirección"         side="from" field="address" placeholder="Av. Principal 123" />
          <Field label="Ciudad / Comuna"   side="from" field="city"    placeholder="Santiago" />
          <Field label="Teléfono"          side="from" field="phone"   placeholder="+56 9 1234 5678" />
        </div>

        <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 14px 4px", marginBottom: 12 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>📥 DESTINATARIO</div>
          <Field label="Nombre"          side="to" field="name"    placeholder="Juan Pérez" />
          <Field label="Dirección"       side="to" field="address" placeholder="Los Aromos 456, Depto 3B" />
          <Field label="Ciudad / Comuna" side="to" field="city"    placeholder="Maipú, Santiago" />
          <Field label="Teléfono"        side="to" field="phone"   placeholder="+56 9 8765 4321" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Instrucciones especiales (opcional)</div>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Ej: Dejar con conserje, llamar antes de entregar…"
            rows={2}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 13, outline: "none", resize: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onSave(form)}
            style={{ flex: 1, padding: 13, borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            💾 Guardar
          </button>
          <button onClick={() => { onSave(form); setTimeout(() => { const { default: print } = require("./printLabel"); print({ ...delivery, label: form }); }, 80); }}
            style={{ flex: 1, padding: 13, borderRadius: 10, background: "#0f172a", color: "#a78bfa", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "1.5px solid #7c3aed" }}>
            🖨 Guardar e Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
