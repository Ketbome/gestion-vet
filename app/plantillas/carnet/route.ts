import { verifySession } from "@/lib/auth";
import { startPdf, pdfResponse } from "@/lib/pdf";
import { rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lightGray = rgb(0.75, 0.75, 0.75);
const black = rgb(0.1, 0.1, 0.1);
const gray = rgb(0.45, 0.45, 0.45);

export async function GET() {
  if (!(await verifySession())) return new Response("No autorizado", { status: 401 });

  const ctx = await startPdf("Carnet de Vacunacion");
  const { page, font, bold, margin, width } = ctx;
  const inner = width - margin * 2;

  const field = (label: string, x: number, y: number, w: number) => {
    page.drawText(label, { x, y: y + 2, size: 8, font, color: gray });
    page.drawLine({
      start: { x, y: y - 8 },
      end: { x: x + w, y: y - 8 },
      thickness: 0.5,
      color: lightGray,
    });
  };

  const y0 = ctx.y;
  field("Mascota", margin, y0, 150);
  field("Especie", margin + 170, y0, 100);
  field("Raza", margin + 290, y0, 120);
  field("Sexo", margin + 430, y0, inner - 430);
  ctx.gap(28);

  const y1 = ctx.y;
  field("Tutor / Propietario", margin, y1, 200);
  field("Telefono", margin + 220, y1, 120);
  field("Fecha de nacimiento", margin + 360, y1, 100);
  field("Microchip", margin + 480, y1, inner - 480);
  ctx.gap(32);

  ctx.hr();
  ctx.gap(8);
  page.drawText("Registro de vacunas", { x: margin, y: ctx.y, size: 10, font: bold, color: black });
  ctx.gap(16);

  const cols = [
    { label: "Vacuna / Producto", x: margin, w: 160 },
    { label: "Laboratorio / Lote", x: margin + 170, w: 130 },
    { label: "Fecha aplicacion", x: margin + 310, w: 100 },
    { label: "Proxima dosis", x: margin + 420, w: 90 },
    { label: "Firma / Sello", x: margin + 520, w: inner - 520 },
  ];

  for (const col of cols) {
    page.drawText(col.label, { x: col.x, y: ctx.y, size: 8, font: bold, color: gray });
  }
  ctx.gap(4);

  page.drawLine({
    start: { x: margin, y: ctx.y },
    end: { x: width - margin, y: ctx.y },
    thickness: 0.5,
    color: lightGray,
  });
  ctx.gap(10);

  for (let i = 0; i < 12; i++) {
    for (const col of cols) {
      page.drawLine({
        start: { x: col.x, y: ctx.y - 6 },
        end: { x: col.x + col.w - 4, y: ctx.y - 6 },
        thickness: 0.4,
        color: lightGray,
      });
    }
    ctx.gap(22);
  }

  ctx.hr();
  ctx.gap(6);
  page.drawText("Registro de desparasitaciones", { x: margin, y: ctx.y, size: 10, font: bold, color: black });
  ctx.gap(16);

  const cols2 = [
    { label: "Producto", x: margin, w: 170 },
    { label: "Via", x: margin + 180, w: 80 },
    { label: "Fecha", x: margin + 270, w: 100 },
    { label: "Proxima", x: margin + 380, w: 100 },
    { label: "Firma / Sello", x: margin + 490, w: inner - 490 },
  ];

  for (const col of cols2) {
    page.drawText(col.label, { x: col.x, y: ctx.y, size: 8, font: bold, color: gray });
  }
  ctx.gap(4);

  page.drawLine({
    start: { x: margin, y: ctx.y },
    end: { x: width - margin, y: ctx.y },
    thickness: 0.5,
    color: lightGray,
  });
  ctx.gap(10);

  for (let i = 0; i < 6; i++) {
    for (const col of cols2) {
      page.drawLine({
        start: { x: col.x, y: ctx.y - 6 },
        end: { x: col.x + col.w - 4, y: ctx.y - 6 },
        thickness: 0.4,
        color: lightGray,
      });
    }
    ctx.gap(22);
  }

  return pdfResponse(await ctx.bytes(), "plantilla-carnet.pdf");
}
