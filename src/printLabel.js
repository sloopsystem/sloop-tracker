// src/printLabel.js
// Abre una ventana de impresión con la etiqueta lista (100x150mm)

export default function printLabel(delivery) {
  const { code, label = {}, createdAt, createdDate } = delivery;
  const from = label.from || {};
  const to   = label.to   || {};
  const orderNumber = label.orderNumber || "";

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Etiqueta ${code}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;background:#fff;}
@page{size:100mm 150mm;margin:0;}
.label{width:100mm;height:150mm;border:2.5px solid #0f172a;display:flex;flex-direction:column;overflow:hidden;}
.hdr{background:#0f172a;color:#fff;padding:5mm 4mm;display:flex;justify-content:space-between;align-items:center;}
.hdr-brand{font-size:13pt;font-weight:900;letter-spacing:1px;}
.hdr-code{font-size:15pt;font-weight:900;font-family:monospace;letter-spacing:4px;color:#60a5fa;}
.qr-row{display:flex;align-items:center;gap:3mm;padding:3.5mm 4mm;border-bottom:1.5px solid #e2e8f0;background:#f8fafc;}
.qr-box{background:#fff;padding:1.5mm;border-radius:2mm;border:1px solid #ddd;flex-shrink:0;}
.code-big{font-size:26pt;font-weight:900;font-family:monospace;letter-spacing:5px;color:#0f172a;}
.hint{font-size:7pt;color:#64748b;margin-top:1mm;}
.date{font-size:7pt;color:#94a3b8;margin-top:1mm;}
.sec{padding:3mm 4mm;border-bottom:1px solid #e2e8f0;}
.sec-lbl{font-size:6pt;font-weight:700;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;margin-bottom:1.5mm;}
.name{font-size:11pt;font-weight:700;color:#0f172a;}
.addr{font-size:8.5pt;color:#334155;line-height:1.4;margin-top:.5mm;}
.phone{font-size:8pt;color:#475569;margin-top:.5mm;}
.arrow{text-align:center;font-size:18pt;padding:1.5mm 0;color:#3b82f6;border-bottom:1px solid #e2e8f0;}
.notes{padding:2.5mm 4mm;flex:1;}
.notes-txt{font-size:8pt;color:#475569;font-style:italic;}
.foot{background:#f1f5f9;padding:2mm 4mm;display:flex;justify-content:space-between;align-items:center;margin-top:auto;}
.foot-id{font-size:7pt;color:#94a3b8;font-family:monospace;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div class="label">
  <div class="hdr"><span class="hdr-brand">📦 DESPACHO</span><span class="hdr-code">${code}</span></div>
  <div class="qr-row">
    <div class="qr-box" id="qr"></div>
    <div>
      <div class="code-big">${code}</div>
      <div class="hint">↑ Escanear para seguimiento</div>
      <div class="date">${createdDate || ""} ${createdAt || ""}</div>
    </div>
  </div>
  <div class="sec">
    <div class="sec-lbl">Remitente</div>
    <div class="name">${from.name || "—"}</div>
    <div class="addr">${[from.address, from.city].filter(Boolean).join(" · ")}</div>
    ${from.phone ? `<div class="phone">✆ ${from.phone}</div>` : ""}
  </div>
  <div class="arrow">↓</div>
  <div class="sec">
    <div class="sec-lbl">Destinatario</div>
    <div class="name">${to.name || "—"}</div>
    <div class="addr">${[to.address, to.city].filter(Boolean).join(" · ")}</div>
    ${to.phone ? `<div class="phone">✆ ${to.phone}</div>` : ""}
  </div>
  ${label.notes ? `<div class="notes"><div class="sec-lbl">Instrucciones</div><div class="notes-txt">${label.notes}</div></div>` : `<div style="flex:1"></div>`}
  <div class="foot">
    <span class="foot-id">ID: ${code}${orderNumber ? ` · Pedido: #${orderNumber}` : ""}</span>
    <span class="foot-id">onloop.cl</span>
  </div>
</div>
<script>
window.onload=function(){
  new QRCode(document.getElementById("qr"),{text:"${code}",width:90,height:90,colorDark:"#0f172a",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.H});
  setTimeout(()=>window.print(),600);
};
<\/script></body></html>`;

  const win = window.open("", "_blank", "width=480,height=680");
  win.document.write(html);
  win.document.close();
}