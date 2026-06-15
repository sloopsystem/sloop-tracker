// src/LabelModal.js
import { useState, useEffect } from "react";
import { watchConfig, saveConfig } from "./db";
import printLabel from "./printLabel";

export default function LabelModal({ delivery, onSave, onClose }) {
  const [companyName, setCompanyName] = useState("");
  const [to, setTo] = useState({ name: "", address: "", city: "", phone: "", email: "", note: "" });

  // Cargar nombre de empresa guardado
  useEffect(() => {
    const unsub = watchConfig((cfg) => {
      if (cfg.companyName) setCompanyName(cfg.companyName);
    });
    return unsub;
  }, []);

  // Pre-llenar si ya tiene datos
  useEffect(() => {
    if (delivery.label?.to) setTo(delivery.label.to);
  }, [delivery]);

  const setF = (field, val) => setTo(t => ({ ...t, [field]: val }));

  const handleSave = async (andPrint = false) => {
    // Guardar nombre empresa en config global
    await saveConfig({ companyName });
    const labelData = { from: { name: companyName }, to };
    onSave(labelData);
    if (andPrint) setTimeout(() => printLabel({ ...delivery, label: labelData }), 80);
  };

  const inp = (label, field, ph, type = "text") => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>{label}</div>
      <input type={type} value={to[field]} onChange={e => setF(field, e.target.value)} placeholder={ph}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: 13, outline: "none" }} />
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

        {/* Remitente — solo nombre empresa */}
        <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 14px 10px", marginBottom: 12 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>📤 REMITENTE</div>
          <div style={{ marginBottom: 4, color: "#64748b", fontSize: 11 }}>Nombre de empresa</div>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Onloop SpA"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#1e293b", color: "#f8fafc", fontSize: 13, outline: "none", marginBottom: 4 }} />
          <div style={{ color: "#475569", fontSize: 11 }}>Se guarda automáticamente para los próximos pedidos</div>
        </div>

        {/* Destinatario */}
        <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 14px 4px", marginBottom: 12 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>📥 DESTINATARIO</div>
          {inp("Nombre", "name", "Juan Pérez")}
          {inp("Dirección", "address", "Los Aromos 456, Depto 3B")}
          {inp("Ciudad / Comuna", "city", "Maipú, Santiago")}
          {inp("Teléfono", "phone", "+56 9 8765 4321")}
          {inp("Email", "email", "juan@email.com", "email")}
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Nota para el conductor</div>
            <textarea value={to.note} onChange={e => setF("note", e.target.value)}
              placeholder="Ej: Dejar con conserje, llamar antes de entregar…" rows={2}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#1e293b", color: "#f8fafc", fontSize: 13, outline: "none", resize: "none" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => handleSave(false)}
            style={{ flex: 1, padding: 13, borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            💾 Guardar
          </button>
          <button onClick={() => handleSave(true)}
            style={{ flex: 1, padding: 13, borderRadius: 10, background: "#0f172a", color: "#a78bfa", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "1.5px solid #7c3aed" }}>
            🖨 Guardar e Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}