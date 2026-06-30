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

  const ctx = await startPdf("Ficha de Admision", size);
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

  const section = (label: string) => {
    page.drawText(label, { x: margin, y: ctx.y, size: 10, font: bold, color: black });
    ctx.gap(16);
  };

  const lines = (count: number) => {
    for (let i = 0; i < count; i++) {
      page.drawLine({
        start: { x: margin, y: ctx.y - 4 },
        end: { x: width - margin, y: ctx.y - 4 },
        thickness: 0.4,
        color: lightGray,
      });
      ctx.gap(18);
    }
  };

  section("Datos del paciente");

  const y0 = ctx.y;
  field("Nombre de la mascota", margin,            y0, sc(150));
  field("Especie",              margin + sc(158),  y0, sc(80));
  field("Raza",                 margin + sc(246),  y0, sc(100));
  field("Sexo",                 margin + sc(354),  y0, sc(60));
  field("Color / Pelaje",       margin + sc(422),  y0, sc(73));
  ctx.gap(28);

  const y1 = ctx.y;
  field("Fecha de nacimiento", margin,            y1, sc(105));
  field("Edad",                margin + sc(113),  y1, sc(60));
  field("Peso (kg)",           margin + sc(181),  y1, sc(60));
  field("Microchip / Tatuaje", margin + sc(249),  y1, sc(130));
  field("Castrado/a",          margin + sc(387),  y1, sc(108));
  ctx.gap(30);

  ctx.hr();
  ctx.gap(8);
  section("Datos del tutor");

  const y2 = ctx.y;
  field("Nombre completo", margin,            y2, sc(185));
  field("RUT",             margin + sc(193),  y2, sc(90));
  field("Telefono",        margin + sc(291),  y2, sc(100));
  field("Email",           margin + sc(399),  y2, sc(96));
  ctx.gap(28);

  const y3 = ctx.y;
  field("Direccion", margin, y3, inner);
  ctx.gap(30);

  ctx.hr();
  ctx.gap(8);
  section("Motivo de consulta");
  lines(3);

  ctx.hr();
  ctx.gap(8);
  section("Anamnesis");

  const y4 = ctx.y;
  field("Duracion de los sintomas", margin,            y4, sc(130));
  field("Progresion",               margin + sc(138),  y4, sc(90));
  field("Apetito",                  margin + sc(236),  y4, sc(70));
  field("Agua",                     margin + sc(314),  y4, sc(65));
  field("Deposiciones",             margin + sc(387),  y4, sc(108));
  ctx.gap(28);

  const y5 = ctx.y;
  field("Vomitos",          margin,            y5, sc(80));
  field("Diarrea",          margin + sc(90),   y5, sc(80));
  field("Tos / Estornudos", margin + sc(180),  y5, sc(120));
  field("Otros signos",     margin + sc(310),  y5, sc(185));
  ctx.gap(28);

  page.drawText("Descripcion de los sintomas:", { x: margin, y: ctx.y, size: 8, font: bold, color: gray });
  ctx.gap(12);
  lines(3);

  ctx.hr();
  ctx.gap(8);
  section("Antecedentes");

  const y6 = ctx.y;
  field("Vacunas al dia",         margin,            y6, sc(100));
  field("Ultima vacuna",          margin + sc(110),  y6, sc(130));
  field("Desparasitacion",        margin + sc(250),  y6, sc(100));
  field("Ultima desparasitacion", margin + sc(358),  y6, sc(137));
  ctx.gap(28);

  const y7 = ctx.y;
  field("Enfermedades previas", margin,            y7, sc(180));
  field("Cirugias previas",     margin + sc(190),  y7, sc(155));
  field("Medicacion actual",    margin + sc(355),  y7, sc(140));
  ctx.gap(30);

  ctx.hr();
  ctx.gap(8);
  section("Examen fisico");

  const y8 = ctx.y;
  field("Temperatura (C)", margin,            y8, sc(110));
  field("FC (lpm)",        margin + sc(120),  y8, sc(80));
  field("FR (rpm)",        margin + sc(210),  y8, sc(80));
  field("TRC (seg)",       margin + sc(300),  y8, sc(80));
  field("Mucosas",         margin + sc(390),  y8, sc(105));
  ctx.gap(28);

  const y9 = ctx.y;
  field("Condicion corporal (1-9)", margin,            y9, sc(150));
  field("Ganglios",                 margin + sc(160),  y9, sc(90));
  field("Pulso",                    margin + sc(260),  y9, sc(80));
  field("Hidratacion",              margin + sc(350),  y9, sc(145));
  ctx.gap(28);

  page.drawText("Observaciones:", { x: margin, y: ctx.y, size: 8, font: bold, color: gray });
  ctx.gap(12);
  lines(3);

  ctx.gap(20);
  ctx.hr();
  page.drawText("Firma del medico veterinario", {
    x: margin,
    y: ctx.y - 2,
    size: 9,
    font,
    color: gray,
  });
  page.drawText("Fecha de atencion: ____________________", {
    x: margin + sc(250),
    y: ctx.y - 2,
    size: 9,
    font,
    color: gray,
  });

  return pdfResponse(await ctx.bytes(), `plantilla-ficha-${size}.pdf`);
}
