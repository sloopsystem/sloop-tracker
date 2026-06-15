import { useState, useEffect } from "react";
import DispatchView from "./DispatchView";
import DriverView from "./DriverView";
import TrackerView from "./TrackerView";
import { watchAllDeliveries } from "./db";

export default function App() {
  const [view, setView] = useState(0);
  const [delivery, setDelivery] = useState(null);

  // Detectar qué URL es
  const path = window.location.pathname;
  const isAdmin = path === "/admin" || path === "/driver";
  const isDriver = path === "/driver";
  const isTracker = path === "/track" || path === "/";

  // Si es tracker, mostrar solo esa vista
  if (isTracker && !isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'Inter', system-ui, sans-serif", color: "#f8fafc", maxWidth: 480, margin: "0 auto" }}>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} } input::placeholder, textarea::placeholder { color: #475569; }`}</style>
        <TrackerView />
      </div>
    );
  }

  // Si es /driver, mostrar solo conductor
  if (isDriver) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'Inter', system-ui, sans-serif", color: "#f8fafc", maxWidth: 480, margin: "0 auto" }}>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} } input::placeholder, textarea::placeholder { color: #475569; }`}</style>
        <DriverView />
      </div>
    );
  }

  // /admin muestra despacho + conductor
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'Inter', system-ui, sans-serif", color: "#f8fafc", maxWidth: 480, margin: "0 auto" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} } input::placeholder, textarea::placeholder { color: #475569; }`}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#0f172a", borderBottom: "1px solid #1e293b", display: "flex" }}>
        {["📋 Despacho", "🚚 Conductor"].map((v, i) => (
          <button key={v} onClick={() => setView(i)}
            style={{ flex: 1, padding: "14px 0", border: "none", background: "transparent", color: view === i ? "#60a5fa" : "#475569", fontWeight: view === i ? 700 : 400, fontSize: 12, cursor: "pointer", borderBottom: view === i ? "2px solid #60a5fa" : "2px solid transparent" }}>
            {v}
          </button>
        ))}
      </div>
      {view === 0 && <DispatchView delivery={delivery} setDelivery={setDelivery} />}
      {view === 1 && <DriverView />}
    </div>
  );
}
