import { verifySession } from "@/lib/auth";
import { pdfResponse } from "@/lib/pdf";
import { getSettings } from "@/lib/settings";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dark    = rgb(0.2,  0.2,  0.2);
const gray    = rgb(0.45, 0.45, 0.45);
const light   = rgb(0.72, 0.72, 0.72);
const primary = rgb(0.12, 0.47, 0.71);

function clean(s: string) {
  return (s ?? "")
    .replace(/['']/g, "'").replace(/[""]/g, '"')
    .replace(/–|—/g, "-").replace(/[^\x00-\xFF]/g, "");
}

function hLine(page: PDFPage, x1: number, x2: number, y: number, t = 0.4) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: t, color: light });
}

function foldLine(page: PDFPage, half: number, h: number) {
  const dash = 5, gap = 4;
  let y = h;
  while (y > 0) {
    page.drawLine({
      start: { x: half, y },
      end: { x: half, y: Math.max(0, y - dash) },
      thickness: 0.4,
      color: light,
    });
    y -= dash + gap;
  }
}

function drawField(
  page: PDFPage, font: PDFFont,
  label: string, x: number, y: number, w: number,
  fontSize: number,
) {
  page.drawText(clean(label), { x, y: y + 2, size: fontSize, font, color: gray });
  hLine(page, x, x + w, y - 7);
}

export async function GET(req: Request) {
  if (!(await verifySession())) return new Response("No autorizado", { status: 401 });

  const url = new URL(req.url);
  const isA5 = url.searchParams.get("size") === "a5";

  // ── page dimensions ──────────────────────────────────────────────────────
  const W    = isA5 ? 595.28 : 841.89;
  const H    = isA5 ? 419.53 : 595.28;
  const HALF = W / 2;
  const M    = isA5 ? 20 : 32;
  const INNER = HALF - M * 2;

  // ── font sizes ───────────────────────────────────────────────────────────
  const FS = {
    label:  isA5 ? 6.5  : 7.5,
    field:  isA5 ? 7    : 8,
    title:  isA5 ? 10   : 13,
    clinic: isA5 ? 12   : 17,
    sub:    isA5 ? 8    : 10,
    info:   isA5 ? 7.5  : 9,
    hint:   isA5 ? 6    : 7,
    section:isA5 ? 9    : 11,
    obs:    isA5 ? 8    : 9,
    sig:    isA5 ? 6.5  : 8,
  };

  const logoSize  = isA5 ? 36 : 56;
  const logoSizeB = isA5 ? 50 : 80;  // back cover
  const rowH      = isA5 ? 30 : 44;
  const rowHDew   = isA5 ? 24 : 36;
  const vaccRows  = isA5 ? 8  : 10;
  const dewRows   = isA5 ? 5  : 6;
  const fieldGap  = isA5 ? 20 : 26;
  const boxW      = isA5 ? 58 : 90;
  const boxH      = isA5 ? 52 : 80;

  const settings = getSettings();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logoImg: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  if (settings.logo?.startsWith("data:image/")) {
    try {
      const b64 = settings.logo.split(",")[1];
      const bytes = Buffer.from(b64, "base64");
      logoImg = settings.logo.includes("image/png")
        ? await doc.embedPng(bytes)
        : await doc.embedJpg(bytes);
    } catch { /* logo inválido */ }
  }

  const clinicName = clean(settings.clinicName || "Veterinaria");

  const f = (page: PDFPage, label: string, x: number, y: number, w: number) =>
    drawField(page, font, label, x, y, w, FS.label);

  // ════════════════════════════════════════════════════════════════════════
  //  PAGE 1 — CONTRAPORTADA (izquierda) | PORTADA (derecha)
  // ════════════════════════════════════════════════════════════════════════
  const p1 = doc.addPage([W, H]);
  foldLine(p1, HALF, H);

  // ── PORTADA (right panel) ────────────────────────────────────────────────
  {
    const px = HALF;
    const cx = px + HALF / 2;
    let y = H - (isA5 ? 22 : 35);

    if (logoImg) {
      p1.drawImage(logoImg, { x: cx - logoSize / 2, y: y - logoSize, width: logoSize, height: logoSize });
      y -= logoSize + 8;
    }

    const nameW = clinicName.length * (isA5 ? 5.5 : 8.5);
    p1.drawText(clinicName, { x: cx - nameW / 2, y, size: isA5 ? 10 : 14, font: bold, color: primary });
    y -= isA5 ? 12 : 18;

    p1.drawLine({ start: { x: px + M, y }, end: { x: W - M, y }, thickness: 0.8, color: primary });
    y -= isA5 ? 12 : 18;

    const title = "CARNET DE VACUNACION";
    const titleW = title.length * (isA5 ? 4.8 : 7.2);
    p1.drawText(title, { x: cx - titleW / 2, y, size: FS.title, font: bold, color: dark });
    y -= isA5 ? 18 : 26;

    const col2 = INNER / 2 - 4;

    f(p1, "Nombre de la mascota", px + M, y, INNER);            y -= fieldGap;
    f(p1, "Especie",              px + M,          y, col2);
    f(p1, "Raza",                 px + M + col2 + 6, y, col2);  y -= fieldGap;
    f(p1, "Sexo",                 px + M,              y, col2 * 0.44);
    f(p1, "Color / Pelaje",       px + M + col2 * 0.5, y, col2 * 0.5);
    f(p1, "Fecha nacimiento",     px + M + col2 + 6,   y, col2); y -= fieldGap;
    f(p1, "Propietario / Tutor",  px + M, y, INNER);             y -= fieldGap;
    f(p1, "Telefono",             px + M,          y, col2);
    f(p1, "Microchip",            px + M + col2 + 6, y, col2);   y -= fieldGap + 4;

    // photo box (right-aligned, beside remaining fields)
    p1.drawRectangle({
      x: W - M - boxW,
      y: y - boxH,
      width: boxW,
      height: boxH,
      borderColor: light,
      borderWidth: 0.5,
    });
    p1.drawText("Foto del",  { x: W - M - boxW + (isA5 ? 8 : 16), y: y - boxH / 2 + 6, size: FS.field, font, color: light });
    p1.drawText("paciente",  { x: W - M - boxW + (isA5 ? 8 : 16), y: y - boxH / 2 - 6, size: FS.field, font, color: light });

    p1.drawText("Doblar por la linea punteada", { x: px + M, y: 10, size: FS.hint, font, color: light });
  }

  // ── CONTRAPORTADA (left panel) ────────────────────────────────────────────
  {
    const cx = HALF / 2;
    let y = H - (isA5 ? 30 : 55);

    if (logoImg) {
      p1.drawImage(logoImg, { x: cx - logoSizeB / 2, y: y - logoSizeB, width: logoSizeB, height: logoSizeB });
      y -= logoSizeB + 10;
    }

    const nameW = clinicName.length * (isA5 ? 6.5 : 10);
    p1.drawText(clinicName, { x: cx - nameW / 2, y, size: FS.clinic, font: bold, color: primary });
    y -= isA5 ? 14 : 22;

    const sub = "Carnet de Vacunacion";
    p1.drawText(sub, { x: cx - (sub.length * (isA5 ? 4 : 6)) / 2, y, size: FS.sub, font, color: gray });
    y -= isA5 ? 18 : 28;

    const info = [
      settings.clinicRut    ? `RUT: ${clean(settings.clinicRut)}`    : null,
      settings.clinicPhone  ? `Tel: ${clean(settings.clinicPhone)}`   : null,
      settings.clinicEmail  ? clean(settings.clinicEmail)             : null,
      settings.clinicAddress? clean(settings.clinicAddress)           : null,
    ].filter(Boolean) as string[];

    for (const line of info) {
      p1.drawText(line, { x: cx - (line.length * (isA5 ? 4 : 5.5)) / 2, y, size: FS.info, font, color: gray });
      y -= isA5 ? 12 : 14;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  PAGE 2 — INTERIOR IZQUIERDO (vacunas) | INTERIOR DERECHO (desparasit.)
  // ════════════════════════════════════════════════════════════════════════
  const p2 = doc.addPage([W, H]);
  foldLine(p2, HALF, H);

  const vaccCols = [
    { label: "Vacuna / Producto",  off: 0,                       w: Math.round(INNER * 0.30) },
    { label: "Lab. / Lote",        off: Math.round(INNER * 0.31), w: Math.round(INNER * 0.22) },
    { label: "Fecha aplicacion",   off: Math.round(INNER * 0.54), w: Math.round(INNER * 0.22) },
    { label: "Proxima dosis",      off: Math.round(INNER * 0.77), w: Math.round(INNER * 0.23) },
  ];

  const drawTable = (
    page: PDFPage,
    panelX: number,
    title: string,
    cols: { label: string; off: number; w: number }[],
    rows: number,
    rH: number,
  ) => {
    let y = H - M;
    page.drawText(clean(title), { x: panelX + M, y, size: FS.section, font: bold, color: dark });
    y -= isA5 ? 12 : 18;
    hLine(page, panelX + M, panelX + HALF - M, y, 0.8);
    y -= isA5 ? 8 : 10;

    for (const col of cols) {
      page.drawText(clean(col.label), {
        x: panelX + M + col.off, y,
        size: FS.label, font: bold, color: gray,
      });
    }
    y -= isA5 ? 5 : 6;
    hLine(page, panelX + M, panelX + HALF - M, y, 0.5);

    for (let i = 0; i < rows; i++) {
      y -= rH;
      hLine(page, panelX + M, panelX + HALF - M, y, 0.4);
    }
    return y;
  };

  drawTable(p2, 0, "Registro de Vacunas", vaccCols, vaccRows, rowH);

  const dewCols = [
    { label: "Producto",      off: 0,                       w: Math.round(INNER * 0.34) },
    { label: "Via",           off: Math.round(INNER * 0.35), w: Math.round(INNER * 0.16) },
    { label: "Fecha",         off: Math.round(INNER * 0.52), w: Math.round(INNER * 0.23) },
    { label: "Proxima dosis", off: Math.round(INNER * 0.76), w: Math.round(INNER * 0.24) },
  ];

  let y2 = drawTable(p2, HALF, "Registro de Desparasitaciones", dewCols, dewRows, rowHDew);

  y2 -= isA5 ? 12 : 16;
  p2.drawText("Observaciones", { x: HALF + M, y: y2, size: FS.obs, font: bold, color: dark });
  y2 -= isA5 ? 10 : 12;
  for (let i = 0; i < (isA5 ? 2 : 3); i++) {
    y2 -= isA5 ? 14 : 18;
    hLine(p2, HALF + M, W - M, y2, 0.4);
  }

  y2 -= isA5 ? 20 : 28;
  hLine(p2, HALF + M, HALF + M + (isA5 ? 100 : 140), y2, 0.6);
  p2.drawText("Firma y sello del veterinario", { x: HALF + M, y: y2 - 10, size: FS.sig, font, color: gray });

  const filename = `carnet-libreta-${isA5 ? "a5" : "a4"}.pdf`;
  return pdfResponse(await doc.save(), filename);
}
