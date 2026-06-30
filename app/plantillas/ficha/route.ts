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

  const ctx = await startPdf("Ficha de Admision");
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
  field("Nombre de la mascota", margin,       y0, 150);
  field("Especie",              margin + 158, y0, 80);
  field("Raza",                 margin + 246, y0, 100);
  field("Sexo",                 margin + 354, y0, 60);
  field("Color / Pelaje",       margin + 422, y0, 73);
  ctx.gap(28);

  const y1 = ctx.y;
  field("Fecha de nacimiento", margin,       y1, 105);
  field("Edad",                margin + 113, y1, 60);
  field("Peso (kg)",           margin + 181, y1, 60);
  field("Microchip / Tatuaje", margin + 249, y1, 130);
  field("Castrado/a",          margin + 387, y1, 108);
  ctx.gap(30);

  ctx.hr();
  ctx.gap(8);
  section("Datos del tutor");

  const y2 = ctx.y;
  field("Nombre completo", margin,       y2, 185);
  field("RUT",             margin + 193, y2, 90);
  field("Telefono",        margin + 291, y2, 100);
  field("Email",           margin + 399, y2, 96);
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
  field("Duracion de los sintomas", margin,       y4, 130);
  field("Progresion",               margin + 138, y4, 90);
  field("Apetito",                  margin + 236, y4, 70);
  field("Agua",                     margin + 314, y4, 65);
  field("Deposiciones",             margin + 387, y4, 108);
  ctx.gap(28);

  const y5 = ctx.y;
  field("Vomitos", margin, y5, 80);
  field("Diarrea", margin + 100, y5, 80);
  field("Tos / Estornudos", margin + 200, y5, 120);
  field("Otros signos", margin + 340, y5, inner - 340);
  ctx.gap(28);

  page.drawText("Descripcion de los sintomas:", { x: margin, y: ctx.y, size: 8, font: bold, color: gray });
  ctx.gap(12);
  lines(3);

  ctx.hr();
  ctx.gap(8);
  section("Antecedentes");

  const y6 = ctx.y;
  field("Vacunas al dia", margin, y6, 100);
  field("Ultima vacuna", margin + 120, y6, 120);
  field("Desparasitacion", margin + 260, y6, 100);
  field("Ultima desparasitacion", margin + 380, y6, inner - 380);
  ctx.gap(28);

  const y7 = ctx.y;
  field("Enfermedades previas", margin, y7, 180);
  field("Cirugias previas", margin + 200, y7, 150);
  field("Medicacion actual", margin + 370, y7, inner - 370);
  ctx.gap(30);

  ctx.hr();
  ctx.gap(8);
  section("Examen fisico");

  const y8 = ctx.y;
  field("Temperatura (C)", margin, y8, 110);
  field("FC (lpm)", margin + 130, y8, 80);
  field("FR (rpm)", margin + 230, y8, 80);
  field("TRC (seg)", margin + 330, y8, 80);
  field("Mucosas", margin + 430, y8, inner - 430);
  ctx.gap(28);

  const y9 = ctx.y;
  field("Condicion corporal (1-9)", margin, y9, 150);
  field("Ganglios", margin + 170, y9, 90);
  field("Pulso", margin + 280, y9, 80);
  field("Hidratacion", margin + 380, y9, inner - 380);
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
    x: margin + 250,
    y: ctx.y - 2,
    size: 9,
    font,
    color: gray,
  });

  return pdfResponse(await ctx.bytes(), "plantilla-ficha-admision.pdf");
}
