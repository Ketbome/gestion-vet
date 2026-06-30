import { verifySession } from "@/lib/auth";
import { pdfResponse } from "@/lib/pdf";
import { getSettings } from "@/lib/settings";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A4 landscape
const W = 841.89;
const H = 595.28;
const HALF = W / 2;       // 420.945
const M = 32;             // margin inside each panel
const INNER = HALF - M * 2;

const black   = rgb(0.08, 0.08, 0.08);
const dark    = rgb(0.2,  0.2,  0.2);
const gray    = rgb(0.45, 0.45, 0.45);
const light   = rgb(0.72, 0.72, 0.72);
const primary = rgb(0.12, 0.47, 0.71);

function clean(s: string) {
  return (s ?? "")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/–|—/g, "-")
    .replace(/[^\x00-\xFF]/g, "");
}

function foldLine(page: PDFPage) {
  const dashLen = 6;
  const gap = 4;
  let y = H;
  while (y > 0) {
    page.drawLine({
      start: { x: HALF, y },
      end: { x: HALF, y: Math.max(0, y - dashLen) },
      thickness: 0.4,
      color: light,
    });
    y -= dashLen + gap;
  }
}

function hLine(page: PDFPage, x1: number, x2: number, y: number, thickness = 0.4) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color: light });
}

function field(
  page: PDFPage,
  font: PDFFont,
  label: string,
  x: number,
  y: number,
  w: number,
) {
  page.drawText(clean(label), { x, y: y + 2, size: 7.5, font, color: gray });
  hLine(page, x, x + w, y - 8);
}

export async function GET() {
  if (!(await verifySession())) return new Response("No autorizado", { status: 401 });

  const settings = getSettings();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── embed logo if present ────────────────────────────────────────────────
  let logoEmbed: { img: Awaited<ReturnType<typeof doc.embedPng>>; size: number } | null = null;
  if (settings.logo?.startsWith("data:image/")) {
    try {
      const b64 = settings.logo.split(",")[1];
      const bytes = Buffer.from(b64, "base64");
      const img = settings.logo.includes("image/png")
        ? await doc.embedPng(bytes)
        : await doc.embedJpg(bytes);
      logoEmbed = { img, size: 60 };
    } catch { /* logo inválido */ }
  }

  const clinicName = clean(settings.clinicName || "Veterinaria");

  // ════════════════════════════════════════════════════════════════════════
  //  PAGE 1 — CONTRAPORTADA (izquierda) | PORTADA (derecha)
  // ════════════════════════════════════════════════════════════════════════
  const p1 = doc.addPage([W, H]);
  foldLine(p1);

  // ── PORTADA (right panel) ────────────────────────────────────────────────
  {
    const px = HALF; // panel left edge
    let y = H - 40;

    // logo + clinic name centered at top
    const logoSize = 56;
    const logoX = px + HALF / 2 - logoSize / 2;
    if (logoEmbed) {
      p1.drawImage(logoEmbed.img, { x: logoX, y: y - logoSize, width: logoSize, height: logoSize });
      y -= logoSize + 10;
    }
    const nameW = clinicName.length * 8.5;
    p1.drawText(clinicName, {
      x: px + HALF / 2 - nameW / 2,
      y,
      size: 14,
      font: bold,
      color: primary,
    });
    y -= 18;

    // separator line
    p1.drawLine({
      start: { x: px + M, y },
      end: { x: W - M, y },
      thickness: 1,
      color: primary,
    });
    y -= 20;

    // title
    const title = "CARNET DE VACUNACION";
    const titleW = title.length * 7.2;
    p1.drawText(title, {
      x: px + HALF / 2 - titleW / 2,
      y,
      size: 13,
      font: bold,
      color: dark,
    });
    y -= 28;

    // ── pet data fields ──
    const col2 = INNER / 2 - 4;

    field(p1, font, "Nombre de la mascota", px + M, y, INNER);
    y -= 26;

    field(p1, font, "Especie",   px + M,           y, col2);
    field(p1, font, "Raza",      px + M + col2 + 8, y, col2);
    y -= 26;

    field(p1, font, "Sexo",             px + M,             y, col2 * 0.45);
    field(p1, font, "Color / Pelaje",   px + M + col2 * 0.5, y, col2 * 0.5);
    field(p1, font, "Fecha nacimiento", px + M + col2 + 8,   y, col2);
    y -= 26;

    field(p1, font, "Propietario / Tutor", px + M, y, INNER);
    y -= 26;

    field(p1, font, "Telefono",  px + M,           y, col2);
    field(p1, font, "Microchip", px + M + col2 + 8, y, col2);
    y -= 28;

    // photo box
    const boxW = 90;
    const boxH = 80;
    p1.drawRectangle({
      x: W - M - boxW,
      y: y - boxH,
      width: boxW,
      height: boxH,
      borderColor: light,
      borderWidth: 0.6,
    });
    p1.drawText("Foto del", { x: W - M - boxW + 18, y: y - boxH / 2 + 6, size: 8, font, color: light });
    p1.drawText("paciente", { x: W - M - boxW + 18, y: y - boxH / 2 - 6, size: 8, font, color: light });

    // fold hint at bottom
    p1.drawText("Doblar por la linea punteada", {
      x: px + M,
      y: 14,
      size: 7,
      font,
      color: light,
    });
  }

  // ── CONTRAPORTADA (left panel) ────────────────────────────────────────────
  {
    const px = 0;
    let y = H - 60;

    // big logo centered
    if (logoEmbed) {
      const s = 80;
      p1.drawImage(logoEmbed.img, {
        x: HALF / 2 - s / 2,
        y: y - s,
        width: s,
        height: s,
      });
      y -= s + 14;
    }
    const nameW = clinicName.length * 10;
    p1.drawText(clinicName, {
      x: HALF / 2 - nameW / 2,
      y,
      size: 17,
      font: bold,
      color: primary,
    });
    y -= 22;

    const sub = "Carnet de Vacunacion";
    const subW = sub.length * 6;
    p1.drawText(sub, { x: HALF / 2 - subW / 2, y, size: 10, font, color: gray });
    y -= 30;

    // contact info
    const info = [
      settings.clinicRut   ? `RUT: ${clean(settings.clinicRut)}` : null,
      settings.clinicPhone ? `Tel: ${clean(settings.clinicPhone)}` : null,
      settings.clinicEmail ? clean(settings.clinicEmail) : null,
      settings.clinicAddress ? clean(settings.clinicAddress) : null,
    ].filter(Boolean) as string[];

    for (const line of info) {
      const w = line.length * 5.5;
      p1.drawText(line, { x: HALF / 2 - w / 2, y, size: 9, font, color: gray });
      y -= 14;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  PAGE 2 — INTERIOR IZQUIERDO (vacunas) | INTERIOR DERECHO (desparasit.)
  // ════════════════════════════════════════════════════════════════════════
  const p2 = doc.addPage([W, H]);
  foldLine(p2);

  const vaccCols = [
    { label: "Vacuna / Producto",  off: 0,                  w: Math.round(INNER * 0.30) },
    { label: "Laboratorio / Lote", off: Math.round(INNER * 0.31), w: Math.round(INNER * 0.22) },
    { label: "Fecha aplicacion",   off: Math.round(INNER * 0.54), w: Math.round(INNER * 0.22) },
    { label: "Proxima dosis",      off: Math.round(INNER * 0.77), w: Math.round(INNER * 0.23) },
  ];

  const drawTableSection = (
    page: PDFPage,
    panelX: number,
    title: string,
    cols: { label: string; off: number; w: number }[],
    rows: number,
    rowH: number,
  ) => {
    let y = H - M;

    page.drawText(clean(title), { x: panelX + M, y, size: 11, font: bold, color: dark });
    y -= 18;
    hLine(page, panelX + M, panelX + HALF - M, y, 0.8);
    y -= 10;

    for (const col of cols) {
      page.drawText(clean(col.label), {
        x: panelX + M + col.off,
        y,
        size: 7.5,
        font: bold,
        color: gray,
      });
    }
    y -= 6;
    hLine(page, panelX + M, panelX + HALF - M, y, 0.5);

    for (let i = 0; i < rows; i++) {
      y -= rowH;
      hLine(page, panelX + M, panelX + HALF - M, y, 0.4);
    }

    return y;
  };

  // ── Interior izquierdo — vacunas ─────────────────────────────────────────
  drawTableSection(p2, 0, "Registro de Vacunas", vaccCols, 10, 44);

  // ── Interior derecho — desparasitaciones + obs ───────────────────────────
  const dewCols = [
    { label: "Producto",      off: 0,                  w: Math.round(INNER * 0.34) },
    { label: "Via",           off: Math.round(INNER * 0.35), w: Math.round(INNER * 0.16) },
    { label: "Fecha",         off: Math.round(INNER * 0.52), w: Math.round(INNER * 0.23) },
    { label: "Proxima dosis", off: Math.round(INNER * 0.76), w: Math.round(INNER * 0.24) },
  ];

  let y2 = drawTableSection(p2, HALF, "Registro de Desparasitaciones", dewCols, 6, 36);

  // observations
  y2 -= 16;
  p2.drawText("Observaciones", { x: HALF + M, y: y2, size: 9, font: bold, color: dark });
  y2 -= 12;
  for (let i = 0; i < 3; i++) {
    y2 -= 18;
    hLine(p2, HALF + M, W - M, y2, 0.4);
  }

  // signature
  y2 -= 28;
  hLine(p2, HALF + M, HALF + M + 140, y2, 0.6);
  p2.drawText("Firma y sello del veterinario", {
    x: HALF + M,
    y: y2 - 12,
    size: 8,
    font,
    color: gray,
  });

  return pdfResponse(await doc.save(), "carnet-libreta.pdf");
}
