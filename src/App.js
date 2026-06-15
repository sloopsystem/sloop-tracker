// src/App.js
import { useState, useEffect } from "react";
import DispatchView from "./DispatchView";
import DriverView from "./DriverView";
import TrackerView from "./TrackerView";

const STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes spin { to { transform: rotate(360deg); } }
  input::placeholder, textarea::placeholder { color: #475569; }
`;

const WRAP = {
  minHeight: "100vh", background: "#0f172a",
  fontFamily: "'Inter', system-ui, sans-serif",
  color: "#f8fafc", maxWidth: 480, margin: "0 auto",
};

export default function App() {
  const path = window.location.pathname;

  // /track o / → cliente
  if (path === "/" || path === "/track") {
    return <div style={WRAP}><style>{STYLE}</style><TrackerView /></div>;
  }

  // /driver → conductor
  if (path === "/driver") {
    return <div style={WRAP}><style>{STYLE}</style><DriverView /></div>;
  }

  // /admin → despacho
  return <div style={WRAP}><style>{STYLE}</style><DispatchView /></div>;
}
