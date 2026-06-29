// src/LiveMap.js
import { useRef, useEffect, useState } from "react";

export default function LiveMap({ lat, lng, trail = [] }) {
  const Z = 15, T = 256;
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setScale(Math.min(1, w / (T * 3)));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const d2t = (la, lo, z) => {
    const n = 2 ** z;
    return {
      x: Math.floor(((lo + 180) / 360) * n),
      y: Math.floor(((1 - Math.log(Math.tan((la * Math.PI) / 180) + 1 / Math.cos((la * Math.PI) / 180)) / Math.PI) / 2) * n),
    };
  };

  const { x: tX, y: tY } = d2t(lat, lng, Z);
  const tiles = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      tiles.push({ dx, dy, x: tX + dx, y: tY + dy });

  const fX = ((lng + 180) / 360) * 2 ** Z - tX;
  const fY = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** Z - tY;
  const mX = T + fX * T;
  const mY = T + fY * T;

  const fullW = T * 3;
  const fullH = T * 3;
  const dispW = fullW * scale;
  const dispH = fullH * scale;

  return (
    <div ref={containerRef} style={{ borderRadius: 10, overflow: "hidden", border: "2px solid #334155", width: "100%" }}>
      <div style={{ position: "relative", width: dispW, height: dispH, overflow: "hidden" }}>
        {/* Scale wrapper */}
        <div style={{ position: "absolute", top: 0, left: 0, width: fullW, height: fullH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {tiles.map(({ dx, dy, x, y }) => (
            <img key={`${x}-${y}`} src={`https://tile.openstreetmap.org/${Z}/${x}/${y}.png`} alt=""
              style={{ position: "absolute", left: (dx + 1) * T, top: (dy + 1) * T, width: T, height: T }} />
          ))}
          {trail.slice(-20).map((p, i) => {
            const { x: tx, y: ty } = d2t(p.lat, p.lng, Z);
            const fx = ((p.lng + 180) / 360) * 2 ** Z - tx + (tx - tX) + 1;
            const fy = ((1 - Math.log(Math.tan((p.lat * Math.PI) / 180) + 1 / Math.cos((p.lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** Z - ty + (ty - tY) + 1;
            return (
              <div key={i} style={{ position: "absolute", left: fx * T - 4, top: fy * T - 4, width: 8, height: 8, borderRadius: "50%", background: `rgba(59,130,246,${0.3 + 0.03 * i})` }} />
            );
          })}
          <div style={{ position: "absolute", left: mX - 18, top: mY - 42, fontSize: 36, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.5))", zIndex: 10 }}>🚚</div>
        </div>
      </div>
      <div style={{ padding: "5px 10px", background: "#0f172a", color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </div>
    </div>
  );
}