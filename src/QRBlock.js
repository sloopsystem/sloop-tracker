// src/QRBlock.js
import { useEffect, useRef } from "react";

const QR_CDN = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";

function loadQRLib() {
  return new Promise((res) => {
    if (window.QRCode) return res();
    const s = document.createElement("script");
    s.src = QR_CDN;
    s.onload = res;
    document.head.appendChild(s);
  });
}

export default function QRBlock({ value, size = 160, dark = "#0f172a" }) {
  const ref_ = useRef(null);
  useEffect(() => {
    loadQRLib().then(() => {
      if (!ref_.current) return;
      ref_.current.innerHTML = "";
      new window.QRCode(ref_.current, {
        text: value,
        width: size,
        height: size,
        colorDark: dark,
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.H,
      });
    });
  }, [value, size, dark]);
  return <div ref={ref_} style={{ display: "inline-block" }} />;
}
