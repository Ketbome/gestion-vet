import { verifySession } from "@/lib/auth";
import { startPdf, pdfResponse } from "@/lib/pdf";
import { rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lightGray = rgb(0.75, 0.75, 0.75);

function drawField(
  page: ReturnType<typeof Object.create>,
  label: string,
  x: number,
  y: number,
  width: number,
  font: import("pdf-lib").PDFFont,
  boldFont: import("pdf-lib").PDFFont
) {
  page.drawText(label, { x, y: y + 2, size: 8, font, color: rgb(0.45, 0.45, 0.45) });
  page.drawLine({
    start: { x, y: y - 8 },
    end: { x: x + width, y: y - 8 },
    thickness: 0.5,
    color: lightGray,
  });
}

export async function GET() {
  if (!(await verifySession())) return new Response("No autorizado", { status: 401 });

  const ctx = await startPdf("Receta Medica Veterinaria");
  const { page, font, bold, margin, width } = ctx;
  const inner = width - margin * 2;

  const field = (label: string, x: number, y: number, w: number) =>
    drawField(page, label, x, y, w, font, bold);

  const y0 = ctx.y;

  field("Fecha", margin, y0, 120);
  field("Mascota", margin + 140, y0, 180);
  field("Tutor / Propietario", margin + 340, y0, inner - 340);
  ctx.gap(28);

  const y1 = ctx.y;
  field("Especie", margin, y1, 100);
  field("Raza", margin + 120, y1, 130);
  field("Sexo", margin + 270, y1, 60);
  field("Edad", margin + 350, y1, 60);
  field("Peso", margin + 430, y1, inner - 430);
  ctx.gap(30);

  ctx.hr();
  ctx.gap(6);
  page.drawText("Medicamentos prescritos", { x: margin, y: ctx.y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
  ctx.gap(16);

  const cols = [
    { label: "Medicamento / Producto", x: margin, w: 180 },
    { label: "Dosis", x: margin + 190, w: 70 },
    { label: "Frecuencia", x: margin + 270, w: 90 },
    { label: "Duracion", x: margin + 370, w: 80 },
    { label: "Instrucciones", x: margin + 460, w: inner - 460 },
  ];

  for (const col of cols) {
    page.drawText(col.label, {
      x: col.x,
      y: ctx.y,
      size: 8,
      font: bold,
      color: rgb(0.45, 0.45, 0.45),
    });
  }
  ctx.gap(14);

  for (let i = 0; i < 8; i++) {
    for (const col of cols) {
      page.drawLine({
        start: { x: col.x, y: ctx.y - 4 },
        end: { x: col.x + col.w - 4, y: ctx.y - 4 },
        thickness: 0.4,
        color: lightGray,
      });
    }
    ctx.gap(18);
  }

  ctx.hr();
  ctx.gap(6);
  page.drawText("Indicaciones generales", { x: margin, y: ctx.y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
  ctx.gap(16);

  for (let i = 0; i < 4; i++) {
    page.drawLine({
      start: { x: margin, y: ctx.y - 4 },
      end: { x: width - margin, y: ctx.y - 4 },
      thickness: 0.4,
      color: lightGray,
    });
    ctx.gap(18);
  }

  ctx.gap(40);
  ctx.hr();
  page.drawText("Firma y sello del medico veterinario", {
    x: margin,
    y: ctx.y - 2,
    size: 9,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  return pdfResponse(await ctx.bytes(), "plantilla-receta.pdf");
}
