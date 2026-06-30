import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getSettings } from "@/lib/settings";

const SIZES = {
  a4: { w: 595.28, h: 841.89 },
  a5: { w: 419.53, h: 595.28 },
};
const MARGIN = 50;
const gray = rgb(0.45, 0.45, 0.45);
const black = rgb(0.1, 0.1, 0.1);

// pdf-lib (WinAnsi) no soporta caracteres fuera de Latin-1
function clean(text: string): string {
  return (text ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–|—/g, "-")
    .replace(/[^\x00-\xFF]/g, "");
}

export type PdfCtx = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  text: (s: string, o?: { size?: number; bold?: boolean; x?: number; color?: "gray" | "black"; gap?: number }) => void;
  row: (cells: { text: string; x: number; bold?: boolean }[], gap?: number) => void;
  gap: (n: number) => void;
  hr: () => void;
  bytes: () => Promise<Uint8Array>;
  width: number;
  margin: number;
};

export async function startPdf(title: string, size: "a4" | "a5" = "a4"): Promise<PdfCtx> {
  const { w: PAGE_W, h: PAGE_H } = SIZES[size];
  const settings = getSettings();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);

  let y = PAGE_H - MARGIN;
  let headerX = MARGIN;

  if (settings.logo?.startsWith("data:image/")) {
    try {
      const b64 = settings.logo.split(",")[1];
      const bytes = Buffer.from(b64, "base64");
      const img = settings.logo.includes("image/png")
        ? await doc.embedPng(bytes)
        : await doc.embedJpg(bytes);
      const size = 54;
      page.drawImage(img, { x: MARGIN, y: y - size, width: size, height: size });
      headerX = MARGIN + size + 12;
    } catch {
      // logo inválido: se omite
    }
  }

  page.drawText(clean(settings.clinicName || "Veterinaria"), {
    x: headerX,
    y: y - 14,
    size: 16,
    font: bold,
    color: black,
  });
  let hy = y - 30;
  const lines = [
    settings.clinicRut ? `RUT ${settings.clinicRut}` : null,
    [settings.clinicPhone, settings.clinicEmail].filter(Boolean).join("  -  ") || null,
    settings.clinicAddress,
  ].filter(Boolean) as string[];
  for (const line of lines) {
    page.drawText(clean(line), { x: headerX, y: hy, size: 9, font, color: gray });
    hy -= 12;
  }

  y = Math.min(y - 70, hy - 6);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1,
    color: gray,
  });
  y -= 22;
  page.drawText(clean(title), { x: MARGIN, y, size: 15, font: bold, color: black });
  y -= 24;

  const ctx: PdfCtx = {
    doc,
    page,
    font,
    bold,
    y,
    width: PAGE_W,
    margin: MARGIN,
    text(s, o = {}) {
      const size = o.size ?? 10;
      ctx.page.drawText(clean(s), {
        x: o.x ?? MARGIN,
        y: ctx.y,
        size,
        font: o.bold ? bold : font,
        color: o.color === "gray" ? gray : black,
      });
      ctx.y -= size + (o.gap ?? 6);
    },
    row(cells, gapAfter = 6) {
      for (const c of cells) {
        ctx.page.drawText(clean(c.text), {
          x: c.x,
          y: ctx.y,
          size: 10,
          font: c.bold ? bold : font,
          color: black,
        });
      }
      ctx.y -= 10 + gapAfter;
    },
    gap(n) {
      ctx.y -= n;
    },
    hr() {
      ctx.page.drawLine({
        start: { x: MARGIN, y: ctx.y + 4 },
        end: { x: PAGE_W - MARGIN, y: ctx.y + 4 },
        thickness: 0.5,
        color: gray,
      });
      ctx.y -= 8;
    },
    async bytes() {
      return ctx.doc.save();
    },
  };
  return ctx;
}

export function pdfResponse(bytes: Uint8Array, filename: string): Response {
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
