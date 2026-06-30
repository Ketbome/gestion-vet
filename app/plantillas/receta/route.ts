import { verifySession } from "@/lib/auth";
import { startPdf, pdfResponse } from "@/lib/pdf";
import { rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lightGray = rgb(0.75, 0.75, 0.75);

export async function GET(req: Request) {
  if (!(await verifySession())) return new Response("No autorizado", { status: 401 });

  const url = new URL(req.url);
  const size = url.searchParams.get("size") === "a5" ? "a5" : "a4";

  const ctx = await startPdf("Receta Medica Veterinaria", size);
  const { page, font, bold, margin, width } = ctx;
  const inner = width - margin * 2;
  const S = inner / 495;

  const sc = (n: number) => Math.round(n * S);
  const gray = rgb(0.45, 0.45, 0.45);
  const black = rgb(0.1, 0.1, 0.1);

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
  field("Fecha",               margin,            y0, sc(120));
  field("Mascota",             margin + sc(140),  y0, sc(180));
  field("Tutor / Propietario", margin + sc(340),  y0, sc(155));
  ctx.gap(28);

  const y1 = ctx.y;
  field("Especie",  margin,            y1, sc(100));
  field("Raza",     margin + sc(110),  y1, sc(130));
  field("Sexo",     margin + sc(250),  y1, sc(60));
  field("Edad",     margin + sc(320),  y1, sc(60));
  field("Peso",     margin + sc(390),  y1, sc(105));
  ctx.gap(30);

  ctx.hr();
  ctx.gap(6);
  page.drawText("Medicamentos prescritos", { x: margin, y: ctx.y, size: 10, font: bold, color: black });
  ctx.gap(16);

  const cols = [
    { label: "Medicamento / Producto", offset: 0,        w: sc(155) },
    { label: "Dosis",                  offset: sc(162),  w: sc(65)  },
    { label: "Frecuencia",             offset: sc(234),  w: sc(82)  },
    { label: "Duracion",               offset: sc(323),  w: sc(72)  },
    { label: "Instrucciones",          offset: sc(402),  w: sc(93)  },
  ];

  for (const col of cols) {
    page.drawText(col.label, {
      x: margin + col.offset,
      y: ctx.y,
      size: 8,
      font: bold,
      color: gray,
    });
  }
  ctx.gap(14);

  const medRows = size === "a5" ? 6 : 8;
  for (let i = 0; i < medRows; i++) {
    for (const col of cols) {
      page.drawLine({
        start: { x: margin + col.offset, y: ctx.y - 4 },
        end: { x: margin + col.offset + col.w - 4, y: ctx.y - 4 },
        thickness: 0.4,
        color: lightGray,
      });
    }
    ctx.gap(18);
  }

  ctx.hr();
  ctx.gap(6);
  page.drawText("Indicaciones generales", { x: margin, y: ctx.y, size: 10, font: bold, color: black });
  ctx.gap(16);

  const noteRows = size === "a5" ? 3 : 4;
  for (let i = 0; i < noteRows; i++) {
    page.drawLine({
      start: { x: margin, y: ctx.y - 4 },
      end: { x: width - margin, y: ctx.y - 4 },
      thickness: 0.4,
      color: lightGray,
    });
    ctx.gap(18);
  }

  ctx.gap(30);
  ctx.hr();
  page.drawText("Firma y sello del medico veterinario", {
    x: margin,
    y: ctx.y - 2,
    size: 9,
    font,
    color: gray,
  });

  return pdfResponse(await ctx.bytes(), `plantilla-receta-${size}.pdf`);
}
