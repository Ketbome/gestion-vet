import { verifySession } from "@/lib/auth";
import { startPdf, pdfResponse } from "@/lib/pdf";
import { rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lightGray = rgb(0.75, 0.75, 0.75);
const black = rgb(0.1, 0.1, 0.1);
const gray = rgb(0.45, 0.45, 0.45);

export async function GET(req: Request) {
  if (!(await verifySession())) return new Response("No autorizado", { status: 401 });

  const url = new URL(req.url);
  const size = url.searchParams.get("size") === "a5" ? "a5" : "a4";

  const ctx = await startPdf("Carnet de Vacunacion", size);
  const { page, font, bold, margin, width } = ctx;
  const inner = width - margin * 2;
  const S = inner / 495;

  const sc = (n: number) => Math.round(n * S);

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
  field("Mascota",           margin,            y0, sc(150));
  field("Especie",           margin + sc(158),  y0, sc(80));
  field("Raza",              margin + sc(246),  y0, sc(100));
  field("Sexo",              margin + sc(354),  y0, sc(65));
  field("Color / Pelaje",    margin + sc(427),  y0, sc(68));
  ctx.gap(28);

  const y1 = ctx.y;
  field("Tutor / Propietario",    margin,            y1, sc(185));
  field("Telefono",               margin + sc(193),  y1, sc(105));
  field("Fecha de nacimiento",    margin + sc(306),  y1, sc(100));
  field("Microchip",              margin + sc(414),  y1, sc(81));
  ctx.gap(32);

  ctx.hr();
  ctx.gap(8);
  page.drawText("Registro de vacunas", { x: margin, y: ctx.y, size: 10, font: bold, color: black });
  ctx.gap(16);

  const cols = [
    { label: "Vacuna / Producto",  offset: 0,   w: sc(140) },
    { label: "Laboratorio / Lote", offset: sc(148), w: sc(100) },
    { label: "Fecha aplicacion",   offset: sc(256), w: sc(82)  },
    { label: "Proxima dosis",      offset: sc(346), w: sc(79)  },
    { label: "Firma / Sello",      offset: sc(433), w: sc(62)  },
  ];

  for (const col of cols) {
    page.drawText(col.label, { x: margin + col.offset, y: ctx.y, size: 8, font: bold, color: gray });
  }
  ctx.gap(4);
  page.drawLine({
    start: { x: margin, y: ctx.y },
    end: { x: width - margin, y: ctx.y },
    thickness: 0.5,
    color: lightGray,
  });

  const vaccineRows = size === "a5" ? 6 : 7;
  for (let i = 0; i < vaccineRows; i++) {
    ctx.gap(50);
    page.drawLine({
      start: { x: margin, y: ctx.y + 4 },
      end: { x: width - margin, y: ctx.y + 4 },
      thickness: 0.4,
      color: lightGray,
    });
  }

  ctx.hr();
  ctx.gap(6);
  page.drawText("Registro de desparasitaciones", { x: margin, y: ctx.y, size: 10, font: bold, color: black });
  ctx.gap(16);

  const cols2 = [
    { label: "Producto",      offset: 0,        w: sc(148) },
    { label: "Via",           offset: sc(156),  w: sc(60)  },
    { label: "Fecha",         offset: sc(224),  w: sc(82)  },
    { label: "Proxima",       offset: sc(314),  w: sc(82)  },
    { label: "Firma / Sello", offset: sc(404),  w: sc(91)  },
  ];

  for (const col of cols2) {
    page.drawText(col.label, { x: margin + col.offset, y: ctx.y, size: 8, font: bold, color: gray });
  }
  ctx.gap(4);
  page.drawLine({
    start: { x: margin, y: ctx.y },
    end: { x: width - margin, y: ctx.y },
    thickness: 0.5,
    color: lightGray,
  });

  const deworRows = size === "a5" ? 4 : 5;
  for (let i = 0; i < deworRows; i++) {
    ctx.gap(30);
    page.drawLine({
      start: { x: margin, y: ctx.y + 4 },
      end: { x: width - margin, y: ctx.y + 4 },
      thickness: 0.4,
      color: lightGray,
    });
  }

  return pdfResponse(await ctx.bytes(), `plantilla-carnet-${size}.pdf`);
}
