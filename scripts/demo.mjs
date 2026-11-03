// Base de datos de demostración (modo completo) en un archivo aparte.
// Borra y recrea data/demo.db en cada ejecución; nunca toca data/gestionvet.db.
// Las fechas son relativas a hoy para que la demo nunca se vea desactualizada.
// Uso: npm run demo   (siembra y levanta `next dev` en el puerto 3200)
//      node scripts/demo.mjs   (solo siembra)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerHooks } from "node:module";
import { randomBytes, scryptSync } from "node:crypto";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

// lib/db/seed.ts importa "./schema" sin extensión: Node ejecuta TypeScript de
// forma nativa pero exige extensiones, así que se resuelven con un hook.
registerHooks({
  resolve(specifier, context, nextResolve) {
    let result;
    try {
      result = nextResolve(specifier, context);
    } catch (err) {
      if (!specifier.startsWith(".")) throw err;
      result = nextResolve(`${specifier}.ts`, context);
    }
    return result.url.endsWith(".ts") ? { ...result, format: "module-typescript" } : result;
  },
});
const { seed } = await import("../lib/db/seed.ts");

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
// Ruta fija a propósito: no se lee DATABASE_PATH para no borrar otra base por error
const dbPath = path.join(root, "data", "demo.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(dbPath + suffix, { force: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const orm = drizzle(sqlite);
migrate(orm, { migrationsFolder: path.join(root, "drizzle") });
seed(orm);
const db = sqlite;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

// PRNG con semilla: la demo sale igual en cada ejecución (salvo las fechas)
let rngState = 20251103;
function rand() {
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;

const now = new Date();
const T = new Date(now.getFullYear(), now.getMonth(), now.getDate());
function iso(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function dateAt(offset) {
  const d = new Date(T);
  d.setDate(d.getDate() + offset);
  return d;
}
const day = (offset) => iso(dateAt(offset));
// 0 = lunes … 6 = domingo (igual que vet_schedules)
const weekdayOf = (offset) => (dateAt(offset).getDay() + 6) % 7;
// La clínica no abre domingo: las atenciones pasadas se mueven al sábado
const openDay = (offset) => (weekdayOf(offset) === 6 ? offset - 1 : offset);
const dateTime = (offset, hhmm = "12:00") => `${day(offset)} ${hhmm}:00`;

function rut(body) {
  let sum = 0;
  let mul = 2;
  for (let n = body; n > 0; n = Math.floor(n / 10)) {
    sum += (n % 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const dv = 11 - (sum % 11);
  const dvStr = dv === 11 ? "0" : dv === 10 ? "K" : String(dv);
  return `${body.toLocaleString("de-DE")}-${dvStr}`;
}

function hash(password) {
  const salt = randomBytes(16).toString("hex");
  return { hash: scryptSync(password, salt, 64).toString("hex"), salt };
}

// ---------------------------------------------------------------------------
// Configuración de la clínica
// ---------------------------------------------------------------------------

db.prepare(
  `INSERT INTO settings (id, clinic_mode, clinic_name, public_booking_enabled, booking_hours_note,
     slot_minutes, iva_enabled, iva_rate, clinic_rut, clinic_address, clinic_phone, clinic_email)
   VALUES (1, 'completo', ?, 1, ?, 30, 1, 19, ?, ?, ?, ?)`
).run(
  "Clínica Veterinaria Los Aromos",
  "Lunes a viernes de 9:00 a 19:00 y sábados de 10:00 a 14:00. Urgencias en horario de atención.",
  rut(76482915),
  "Av. Los Aromos 2140, Ñuñoa, Santiago",
  "+56 2 2794 3150",
  "contacto@example.com"
);

// Servicios propios de la clínica, además del catálogo base
const insertService = db.prepare(
  "INSERT INTO services (name, price, description) VALUES (?,?,?)"
);
for (const [name, price, description] of [
  ["Hemograma + perfil bioquímico", 38000, "Exámenes de sangre (laboratorio externo)"],
  ["Ecografía abdominal", 35000, "Ecografía abdominal completa"],
  ["Radiografía (2 proyecciones)", 30000, "Radiografía digital"],
  ["Test rápido parvovirus", 18000, "Test inmunocromatográfico en clínica"],
  ["Curva de glucosa", 22000, "Medición seriada de glicemia (6 puntos)"],
  ["Profilaxis dental", 70000, "Destartraje y pulido bajo anestesia"],
  ["Microchip (implantación)", 15000, "Incluye registro en la plataforma nacional"],
]) {
  insertService.run(name, price, description);
}

// Precios de la clínica (el catálogo base trae precios referenciales)
const setPrice = db.prepare("UPDATE services SET price = ? WHERE name = ?");
for (const [name, price] of [
  ["Consulta general", 25000], ["Control", 15000], ["Vacunación (vacuna del cliente)", 10000],
  ["Desparasitación", 12000], ["Peluquería / baño", 25000], ["Cirugía menor", 90000],
  ["Esterilización", 110000], ["Eutanasia", 60000], ["Atención de urgencia", 40000],
]) {
  setPrice.run(price, name);
}

const serviceByName = new Map(
  db.prepare("SELECT id, name, price FROM services").all().map((s) => [s.name, s])
);
const productByName = new Map(
  db.prepare("SELECT id, name, category, cost_price, sale_price FROM products").all().map((p) => [p.name, p])
);
function service(name) {
  const s = serviceByName.get(name);
  if (!s) throw new Error(`Servicio no encontrado: ${name}`);
  return s;
}
function product(name) {
  const p = productByName.get(name);
  if (!p) throw new Error(`Producto no encontrado: ${name}`);
  return p;
}

// ---------------------------------------------------------------------------
// Equipo y horarios (clave para todos: demo123)
// ---------------------------------------------------------------------------

const insertUser = db.prepare(
  `INSERT INTO users (username, name, role, password_hash, password_salt, color)
   VALUES (?,?,?,?,?,?)`
);
const insertSchedule = db.prepare(
  "INSERT INTO vet_schedules (user_id, weekday, start_time, end_time) VALUES (?,?,?,?)"
);

const staff = {
  // Director sin horario propio: así su agenda muestra la de todo el equipo
  admin: { username: "admin", name: "Dr. Andrés Muñoz", role: "admin", color: "#0ea5e9", schedule: [] },
  crojas: { username: "crojas", name: "Dra. Camila Rojas", role: "veterinario", color: "#16a34a",
    schedule: [0, 1, 2, 3, 4].flatMap((wd) => [[wd, "09:00", "13:00"], [wd, "15:00", "18:00"]]) },
  mcontreras: { username: "mcontreras", name: "Dr. Matías Contreras", role: "veterinario", color: "#7c3aed",
    schedule: [
      ...[0, 1, 2, 3, 4].flatMap((wd) => [[wd, "11:00", "14:00"], [wd, "15:00", "19:00"]]),
      [5, "10:00", "14:00"],
    ] },
  vsoto: { username: "vsoto", name: "Dra. Valentina Soto", role: "veterinario", color: "#ea580c",
    schedule: [[1, "09:00", "13:00"], [2, "15:00", "19:00"], [3, "09:00", "13:00"], [5, "10:00", "13:00"]] },
  recepcion: { username: "recepcion", name: "Javiera Morales", role: "recepcion", color: "#db2777", schedule: [] },
};
for (const member of Object.values(staff)) {
  const { hash: h, salt } = hash("demo123");
  member.id = insertUser
    .run(member.username, member.name, member.role, h, salt, member.color)
    .lastInsertRowid;
  for (const [wd, start, end] of member.schedule) insertSchedule.run(member.id, wd, start, end);
}
const worksOn = (key, offset) => staff[key].schedule.some(([wd]) => wd === weekdayOf(offset));

// Bloqueos puntuales de agenda
const insertBlock = db.prepare(
  "INSERT INTO vet_blocks (user_id, date, start_time, end_time, reason) VALUES (?,?,?,?,?)"
);
{
  let vacation = 8;
  while (!worksOn("vsoto", vacation)) vacation++;
  insertBlock.run(staff.vsoto.id, day(vacation), null, null, "Congreso de medicina felina");
  let course = 4;
  while (weekdayOf(course) > 4) course++;
  insertBlock.run(staff.mcontreras.id, day(course), "15:00", "19:00", "Capacitación en ecografía");
}

// ---------------------------------------------------------------------------
// Tutores
// ---------------------------------------------------------------------------

const TUTORS = [
  ["Carolina Valenzuela Ríos", 15873402, "Pasaje Los Jazmines 1180, Ñuñoa"],
  ["Felipe Andrade Muñoz", 17234981, "Av. Grecia 3340, depto 504, Ñuñoa"],
  ["Daniela Espinoza Tapia", 13456720, "Los Plátanos 2215, Macul"],
  ["Sebastián Castro Leiva", 18902345, "Av. Providencia 2550, depto 1203, Providencia"],
  ["Francisca Gutiérrez Pino", 9876543, "Simón Bolívar 4501, La Reina"],
  ["Ignacio Reyes Bravo", 19345221, "Quilín 3900, Peñalolén"],
  ["Constanza Herrera Salinas", 16789012, "Irarrázaval 4120, depto 302, Ñuñoa"],
  ["Rodrigo Fernández Lagos", 12345098, "Av. Ossa 1745, La Reina"],
  ["Antonia Morales Vega", 20123456, "Dublé Almeyda 2870, Ñuñoa"],
  ["Diego Navarro Fuentes", 11222333, "Los Militares 5620, Las Condes"],
  ["Catalina Pizarro Sepúlveda", 18456789, "Av. Macul 2980, Macul"],
  ["Tomás Sepúlveda Araya", 14567321, "Exequiel Fernández 1650, Ñuñoa"],
  ["Paula Sandoval Cortés", 17890123, "José Domingo Cañas 1520, Ñuñoa"],
  ["Cristóbal Muñoz Díaz", 10987654, "Tobalaba 6120, Peñalolén"],
  ["Macarena Silva Orellana", 15234876, "Manuel Montt 1020, Providencia"],
  ["Nicolás Vargas Henríquez", 19876012, "Av. Matta 820, Santiago"],
  ["Fernanda Riquelme Ortiz", 16234590, "Gran Avenida 5420, San Miguel"],
  ["Joaquín Torres Alarcón", 18123987, "Walker Martínez 2100, La Florida"],
  ["Isidora Campos Figueroa", 20567834, "Pedro de Valdivia 3410, Ñuñoa"],
  ["Gabriel Jara Toledo", 13987456, "Departamental 1340, Macul"],
  ["Sofía Bustos Molina", 19012876, "Av. Italia 1450, Providencia"],
  ["Vicente Parra Quiroz", 17345612, "Echeñique 5830, La Reina"],
  ["Martina Olivares Carrasco", 20876543, "Las Torres 1290, Peñalolén"],
  ["Benjamín Cárdenas Ibarra", 12876234, "Vicuña Mackenna 6800, La Florida"],
  ["Gloria Aravena Rubio", 6543210, "Holanda 2380, Providencia"],
  ["Hernán Medina Zúñiga", 8123456, "Av. Larraín 6230, La Reina"],
  // Pacientes ocasionales (historial más corto)
  ["Andrea Figueroa Lillo", 16543287, "Av. Irarrázaval 2890, Ñuñoa"],
  ["Marcelo Ibáñez Pozo", 11765432, "Los Cerezos 450, Ñuñoa"],
  ["Valeria Contreras Mena", 18765098, "Av. José Pedro Alessandri 1020, Macul"],
  ["Pía Gallardo Vergara", 19234567, "Lo Plaza 180, Providencia"],
  ["Esteban Leiva Carrasco", 14876234, "Av. Tobalaba 9800, Peñalolén"],
  ["Claudia Zamora Pérez", 12543876, "Santa Isabel 1340, Santiago"],
  ["Francisco Urrutia Bravo", 17654321, "Av. Las Perdices 2100, La Reina"],
  ["Josefa Montecinos Lira", 20345678, "Sucre 2650, Ñuñoa"],
  ["Mauricio Cifuentes Garrido", 10456789, "Av. Departamental 4500, La Florida"],
  ["Ximena Poblete Vidal", 9345612, "Carlos Antúnez 1880, Providencia"],
  ["Agustín Salazar Rivas", 21034567, "Av. Grecia 6100, Peñalolén"],
  ["Bárbara Núñez Tapia", 18234098, "Gran Avenida 6800, San Miguel"],
  ["Ricardo Ahumada Pinto", 13234765, "Av. Macul 4720, Macul"],
  ["Lorena Escobar Fuentealba", 15987234, "Chile España 560, Ñuñoa"],
  ["Gonzalo Riveros Maturana", 16098234, "Av. Ossa 2350, Ñuñoa"],
  ["Camila Fuenzalida Rojo", 19567123, "Los Alerces 3120, Ñuñoa"],
  ["Patricio Godoy Araneda", 9786123, "Av. Príncipe de Gales 6900, La Reina"],
  ["Daniela Moya Sánchez", 17456901, "Rodrigo de Araya 1850, Macul"],
  ["Felipe Zúñiga Olave", 20987345, "Av. Pedro de Valdivia 1215, Providencia"],
  ["Carla Venegas Opazo", 15123908, "Mar Tirreno 3400, Peñalolén"],
  ["Álvaro Pacheco Silva", 12098765, "Av. Vicuña Mackenna 3900, Macul"],
  ["Rocío Alvarado Muñoz", 18890123, "San Eugenio 1450, Ñuñoa"],
];
const tutorNotes = {
  4: "Prefiere contacto por WhatsApp.",
  7: "Paga a fin de mes (acordado con administración).",
  24: "Adulta mayor, prefiere llamadas telefónicas.",
};
const insertTutor = db.prepare(
  "INSERT INTO tutors (name, phone, email, rut, address, notes, created_at) VALUES (?,?,?,?,?,?,?)"
);
const tutors = TUTORS.map(([name, rutBody, address], i) => {
  const phone = `+56 9 ${between(5000, 9999)} ${between(1000, 9999)}`;
  const [first, last] = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(" ");
  // Algunos clientes no dejan email o RUT, como en la vida real
  const email = i % 7 === 5 ? null : `${first}.${last}@example.com`;
  const rutStr = i % 9 === 8 ? null : rut(rutBody);
  const id = insertTutor
    .run(name, phone, email, rutStr, `${address}, Santiago`, tutorNotes[i] ?? null, dateTime(-between(200, 700)))
    .lastInsertRowid;
  return { id, name, phone, email };
});

// ---------------------------------------------------------------------------
// Plantillas clínicas
// ---------------------------------------------------------------------------

const EXAM_OK =
  "Buen estado general, CC 5/9. Mucosas rosadas, TLLC < 2 s. Auscultación cardiopulmonar sin alteraciones. Linfonodos de tamaño normal. Abdomen blando, no doloroso.";

// Cada plantilla recibe la mascota y devuelve servicios, productos, ficha clínica y receta
const TEMPLATES = {
  vacunaPerro: (p) => ({
    products: [["Vacuna óctuple canina", 1]],
    anamnesis: "Control anual y vacunación. Tutor no reporta cambios en apetito ni conducta.",
    exam: EXAM_OK,
    dx: "Paciente sano. Plan de vacunación anual.",
    tx: `Se aplica vacuna óctuple a ${p.name}. Próxima dosis en 12 meses.`,
  }),
  vacunaPerroRabia: (p) => ({
    products: [["Vacuna óctuple canina", 1], ["Vacuna antirrábica", 1]],
    anamnesis: "Control anual. Sin antecedentes clínicos desde la última visita.",
    exam: EXAM_OK,
    dx: "Paciente sano. Vacunación anual.",
    tx: `Se aplican vacunas óctuple y antirrábica a ${p.name}. Certificado de vacunación entregado.`,
  }),
  vacunaGato: (p) => ({
    products: [["Vacuna triple felina", 1]],
    anamnesis: "Control anual. Gato de interior, sin contacto con otros gatos.",
    exam: "Buen estado general, CC 5/9. Mucosas rosadas. Cavidad oral sin lesiones. Auscultación normal.",
    dx: "Paciente sano. Vacunación anual.",
    tx: `Se aplica vacuna triple felina a ${p.name}. Próxima dosis en 12 meses.`,
  }),
  vacunaGatoLeucemia: (p) => ({
    products: [["Vacuna triple felina", 1], ["Vacuna leucemia felina", 1]],
    anamnesis: "Control anual. Sale al patio, contacto ocasional con gatos del barrio.",
    exam: "Buen estado general, CC 5/9. Mucosas rosadas. Auscultación normal.",
    dx: "Paciente sano. Vacunación anual (incluye leucemia por acceso al exterior).",
    tx: `Se aplican triple felina y leucemia felina a ${p.name}.`,
  }),
  puppy1: (p) => ({
    services: [["Consulta general", 1]],
    products: [["Vacuna parvovirus (puppy)", 1], ["Drontal perro (comprimido)", 1]],
    anamnesis: `Primera consulta. ${p.name} fue adoptado/a hace una semana. Come bien, deposiciones normales.`,
    exam: "Cachorro activo, buen estado de hidratación. Sin ectoparásitos visibles. Auscultación normal.",
    dx: "Cachorro sano. Inicio de plan de vacunación y desparasitación.",
    tx: "Vacuna parvovirus (puppy) y desparasitación interna. Próxima vacuna en 21 días.",
  }),
  puppy2: (p) => ({
    products: [["Vacuna séxtuple canina", 1], ["Drontal perro (comprimido)", 1]],
    anamnesis: "Segunda dosis del plan de vacunación. Sin reacciones a la dosis anterior.",
    exam: "Cachorro activo, buen crecimiento. Mucosas rosadas.",
    dx: "Cachorro sano.",
    tx: `Vacuna séxtuple y segunda desparasitación de ${p.name}. Próxima vacuna en 21 días.`,
  }),
  puppy3: (p) => ({
    products: [["Vacuna óctuple canina", 1]],
    anamnesis: "Tercera dosis del plan de vacunación.",
    exam: "Cachorro en buen estado, curva de crecimiento adecuada.",
    dx: "Cachorro sano.",
    tx: `Vacuna óctuple a ${p.name}. Próxima: antirrábica en 3 semanas.`,
  }),
  puppyRabia: (p) => ({
    products: [["Vacuna antirrábica", 1], ["Vacuna KC (tos de las perreras)", 1]],
    anamnesis: "Cierre del plan de vacunación de cachorro.",
    exam: EXAM_OK,
    dx: "Paciente sano. Plan de vacunación completo.",
    tx: `Antirrábica y KC a ${p.name}. Se conversa esterilización a partir de los 6 meses.`,
  }),
  kitten1: (p) => ({
    services: [["Consulta general", 1]],
    products: [["Vacuna triple felina", 1], ["Drontal gato (comprimido)", 1]],
    anamnesis: `Primera consulta. ${p.name} fue rescatado/a de la calle hace 10 días.`,
    exam: "Gatito activo, leve otitis por ácaros. Sin fiebre.",
    dx: "Gatito sano. Otodectes cynotis leve.",
    tx: "Triple felina, desparasitación interna y limpieza de oídos.",
  }),
  desparasitacion: (p) => ({
    services: [["Desparasitación", 1]],
    products: [[p.species === "gato" ? "Drontal gato (comprimido)" : "Drontal perro (comprimido)", 1]],
    anamnesis: "Desparasitación interna de rutina.",
    exam: "Sin hallazgos relevantes.",
    dx: "Paciente sano.",
    tx: "Antiparasitario interno vía oral. Repetir en 3 meses.",
  }),
  pipetaGato: () => ({
    products: [["Pipeta Revolution gato", 1]],
    anamnesis: "Tutor consulta por prevención de pulgas.",
    exam: "Sin ectoparásitos visibles.",
    dx: "Prevención de ectoparásitos.",
    tx: "Se aplica pipeta Revolution. Repetir mensualmente.",
  }),
  grooming: (p) => ({
    services: [["Peluquería / baño", 1]],
    products: p.antiparasitic && !p.antiparasitic.startsWith("Bravecto") ? [[p.antiparasitic, 1]] : [],
    clinical: false,
    notes: pick([
      "Baño, corte de uñas y limpieza de oídos.",
      "Baño y corte de raza. Sin hallazgos en piel.",
      "Baño medicado y deslanado. Se entrega antiparasitario mensual.",
      "Corte higiénico y baño. Tutor retira a las 17:00.",
    ]),
  }),
  otitis: () => ({
    services: [["Consulta general", 1]],
    products: [["Gotas óticas (otitis)", 1]],
    anamnesis: "Se rasca la oreja derecha y sacude la cabeza hace 5 días. Mal olor.",
    exam: "Conducto auditivo derecho eritematoso con secreción ceruminosa oscura. Citología: levaduras (Malassezia) ++.",
    dx: "Otitis externa por Malassezia, oído derecho.",
    tx: "Limpieza ótica en clínica. Gotas óticas cada 12 h por 10 días. Control en 2 semanas.",
    rx: [["Gotas óticas (otitis)", "5 gotas oído derecho", "Cada 12 horas", "10 días", "Limpiar el oído antes de aplicar."]],
  }),
  otitisControl: () => ({
    services: [["Control", 1]],
    anamnesis: "Control de otitis. Tutor refiere mejoría, ya no se rasca.",
    exam: "Conducto auditivo sin eritema ni secreción. Citología negativa.",
    dx: "Otitis externa resuelta.",
    tx: "Alta de otitis. Limpieza ótica semanal preventiva.",
  }),
  gastro: (p) => ({
    services: [["Consulta general", 1]],
    products: [["Metronidazol 250 mg (comprimido)", 10], ["Omeprazol 20 mg (cápsula)", 5]],
    anamnesis: "Vómitos (3 episodios) y diarrea pastosa desde ayer. Comió basura en la plaza.",
    exam: "Deshidratación leve (5%). Dolor leve a la palpación abdominal craneal. Temperatura normal.",
    dx: "Gastroenteritis aguda por indiscreción alimentaria.",
    tx: "Dieta blanda 3 días, metronidazol y omeprazol. Volver si persisten los vómitos.",
    rx: [
      ["Metronidazol 250 mg", p.weightKg > 15 ? "1 comprimido" : "½ comprimido", "Cada 12 horas", "5 días", "Dar con comida."],
      ["Omeprazol 20 mg", "1 cápsula", "Cada 24 horas", "5 días", "En ayunas, 30 min antes de comer."],
    ],
  }),
  dermatitis: (p) => ({
    services: [["Consulta general", 1]],
    products: [["Shampoo medicado (clorhexidina)", 1], ["Prednisolona 5 mg (comprimido)", 10]],
    anamnesis: "Prurito intenso en abdomen y patas hace 3 semanas. Se lame constantemente.",
    exam: "Eritema y pápulas en zona inguinal y espacios interdigitales. Alopecia por lamido. Sin pulgas.",
    dx: "Dermatitis atópica canina (brote).",
    tx: "Baños con clorhexidina 2 veces por semana, prednisolona en dosis decreciente. Dieta hipoalergénica.",
    rx: [
      ["Prednisolona 5 mg", `${Math.max(1, Math.round(p.weightKg / 10))} comprimido(s)`, "Cada 24 horas", "5 días, luego día por medio", "No suspender bruscamente."],
      ["Shampoo medicado (clorhexidina)", "Baño completo", "2 veces por semana", "4 semanas", "Dejar actuar 10 minutos antes de enjuagar."],
    ],
  }),
  dermControl: () => ({
    services: [["Control", 1]],
    anamnesis: "Control de dermatitis. Disminuyó el prurito, sigue con los baños.",
    exam: "Piel con mejoría notoria, eritema leve residual en espacios interdigitales.",
    dx: "Dermatitis atópica en remisión parcial.",
    tx: "Continuar baños semanales y dieta hipoalergénica.",
  }),
  cojera: (p) => ({
    services: [["Consulta general", 1], ["Radiografía (2 proyecciones)", 1]],
    products: [["Meloxicam 1,5 mg/ml gotas", 1]],
    anamnesis: "Cojea del miembro posterior izquierdo desde hace 4 días, después de correr en el parque.",
    exam: "Claudicación grado 2/4 MPI. Dolor a la extensión de rodilla, prueba de cajón dudosa.",
    dx: "Esguince de rodilla izquierda. Descartar ruptura parcial de ligamento cruzado craneal.",
    tx: "Reposo 2 semanas, paseos cortos con correa, meloxicam 7 días. Control en 14 días.",
    rx: [["Meloxicam 1,5 mg/ml gotas", `${Math.round(p.weightKg * 0.1 * 20) / 20} ml`, "Cada 24 horas", "7 días", "Dar con comida. Suspender si vomita."]],
  }),
  conjuntivitis: () => ({
    services: [["Consulta general", 1]],
    products: [["Colirio oftálmico veterinario", 1]],
    anamnesis: "Ojo izquierdo rojo y con secreción hace 2 días.",
    exam: "Hiperemia conjuntival OI, secreción mucopurulenta. Test de fluoresceína negativo.",
    dx: "Conjuntivitis bacteriana OI.",
    tx: "Limpieza con suero y colirio antibiótico 7 días.",
    rx: [["Colirio oftálmico veterinario", "1 gota ojo izquierdo", "Cada 8 horas", "7 días", "Limpiar secreción con suero antes de aplicar."]],
  }),
  tos: () => ({
    services: [["Consulta general", 1]],
    products: [["Doxiciclina 100 mg (comprimido)", 10]],
    anamnesis: "Tos seca tipo graznido hace 4 días. Estuvo en guardería canina la semana pasada.",
    exam: "Reflejo tusígeno positivo a la palpación traqueal. Sin fiebre, auscultación pulmonar normal.",
    dx: "Traqueobronquitis infecciosa canina (tos de las perreras).",
    tx: "Doxiciclina 10 días, evitar collar (usar arnés). Volver si presenta fiebre o decaimiento.",
    rx: [["Doxiciclina 100 mg", "1 comprimido", "Cada 24 horas", "10 días", "Dar con abundante agua."]],
  }),
  cistitis: () => ({
    services: [["Consulta general", 1], ["Ecografía abdominal", 1]],
    products: [["Meloxicam 1,5 mg/ml gotas", 1]],
    anamnesis: "Va muchas veces al arenero y orina poco, con algo de sangre. Mudanza reciente.",
    exam: "Vejiga pequeña y dolorosa a la palpación. Sin obstrucción.",
    dx: "Cistitis idiopática felina asociada a estrés.",
    tx: "Meloxicam 5 días, aumentar consumo de agua (fuente), feromonas ambientales.",
    rx: [["Meloxicam 1,5 mg/ml gotas", "0,1 ml", "Cada 24 horas", "5 días", "Con comida."]],
  }),
  herida: (p) => ({
    services: [["Atención de urgencia", 1], ["Cirugía menor", 1]],
    products: [
      ["Sutura nylon 3-0", 1], ["Gasa estéril (paquete)", 2], ["Povidona yodada 250 ml", 1],
      ["Cefalexina 500 mg (comprimido)", 14], ["Collar isabelino N°15", 1],
    ],
    anamnesis: "Pelea con otro perro en la plaza hace 2 horas. Herida sangrante en cuello.",
    exam: "Herida punzante de 4 cm en región cervical lateral, sin compromiso de estructuras profundas. Signos vitales estables.",
    dx: "Herida por mordedura, región cervical.",
    tx: "Sedación, lavado, debridamiento y sutura. Cefalexina 7 días y collar isabelino. Retiro de puntos en 10 días.",
    rx: [
      ["Cefalexina 500 mg", p.weightKg > 25 ? "2 comprimidos" : "1 comprimido", "Cada 12 horas", "7 días", "Completar el tratamiento."],
      ["Meloxicam 1,5 mg/ml gotas", `${Math.round(p.weightKg * 0.1 * 20) / 20} ml`, "Cada 24 horas", "4 días", "Con comida."],
    ],
  }),
  esterilizacion: (p) => ({
    services: [["Hemograma + perfil bioquímico", 1], ["Esterilización", 1]],
    products: [
      ["Catéter intravenoso 22G", 1], ["Suero Ringer lactato 500 ml", 1], ["Sutura nylon 3-0", 1],
      ["Hoja de bisturí N°15", 1], ["Guantes de látex (par)", 3], ["Gasa estéril (paquete)", 2],
      ["Meloxicam 1,5 mg/ml gotas", 1], ["Collar isabelino N°15", 1],
    ],
    anamnesis: `Ingresa en ayuno de 12 h para ${p.sex === "hembra" ? "ovariohisterectomía" : "orquiectomía"} electiva.`,
    exam: "Apto para anestesia (ASA I). Exámenes prequirúrgicos dentro de rangos normales.",
    dx: `${p.sex === "hembra" ? "Ovariohisterectomía" : "Orquiectomía"} electiva sin complicaciones.`,
    tx: "Cirugía sin incidentes. Collar isabelino 10 días, analgesia por 4 días. Control y retiro de puntos en 10 días.",
    rx: [
      ["Meloxicam 1,5 mg/ml gotas", `${Math.round(p.weightKg * 0.1 * 20) / 20} ml`, "Cada 24 horas", "4 días", "Con comida."],
      ["Amoxicilina + ác. clavulánico suspensión", "Según peso", "Cada 12 horas", "7 días", "Mantener refrigerada."],
    ],
  }),
  postop: () => ({
    services: [["Control", 1]],
    anamnesis: "Control postoperatorio. Ha estado tranquilo/a, come bien.",
    exam: "Herida quirúrgica limpia y cicatrizada, sin signos de infección. Se retiran puntos.",
    dx: "Evolución postoperatoria favorable.",
    tx: "Alta quirúrgica. Puede retomar actividad normal.",
  }),
  renal: (p, i) => ({
    services: [["Control", 1], ...(i % 2 === 0 ? [["Hemograma + perfil bioquímico", 1]] : [])],
    products: [["Dieta renal gato 1,5 kg", 1], ...(i % 2 === 1 ? [["Suero fisiológico 500 ml", 2]] : [])],
    anamnesis: "Control de enfermedad renal crónica. Toma más agua, apetito selectivo.",
    exam: "Deshidratación leve. Riñones pequeños e irregulares a la palpación. PA sistólica 150 mmHg.",
    dx: i % 2 === 0 ? `ERC IRIS estadio 2. Creatinina ${(2.1 + i * 0.05).toFixed(1)} mg/dl, SDMA ${18 + i} µg/dl.` : "ERC IRIS estadio 2, estable.",
    tx: "Dieta renal, fluidoterapia subcutánea 100 ml 3 veces por semana (tutor capacitado). Control mensual.",
    rx: i === 0 ? [["Dieta renal gato", "Ración según tabla", "Diaria", "Permanente", "Transición gradual en 7 días."]] : undefined,
  }),
  diabetes: (p, i) => ({
    services: [["Control", 1], ...(i % 2 === 0 ? [["Curva de glucosa", 1]] : [])],
    products: [["Jeringa 1 ml", 30], ...(i % 3 === 0 ? [["Insulina veterinaria (frasco)", 1]] : [])],
    anamnesis: i === 0
      ? "Toma mucha agua y orina mucho hace un mes. Bajó de peso pese a comer bien."
      : "Control de diabetes. Tutor aplica insulina cada 12 h sin problemas.",
    exam: i === 0
      ? "CC 4/9, pelaje opaco. Glicemia 420 mg/dl, glucosuria +++."
      : `Glicemia en curva: nadir ${Math.max(110, 260 - i * 30)} mg/dl. Sin signos de hipoglicemia.`,
    dx: i === 0 ? "Diabetes mellitus felina." : "Diabetes mellitus en ajuste de dosis.",
    tx: i === 0
      ? "Inicio de insulina 1 UI cada 12 h y dieta alta en proteína. Capacitación al tutor."
      : `Insulina ${Math.min(3, 1 + Math.floor(i / 2))} UI cada 12 h. Control en 3-4 semanas.`,
    rx: i === 0 ? [["Insulina veterinaria", "1 UI subcutánea", "Cada 12 horas", "Permanente", "Aplicar después de comer. Ante temblores, dar miel en encías y llamar."]] : undefined,
  }),
  cardio: (p, i) => ({
    services: [[i === 0 ? "Consulta general" : "Control", 1], ...(i === 0 ? [["Radiografía (2 proyecciones)", 1]] : [])],
    products: [["Furosemida 40 mg (comprimido)", 30]],
    anamnesis: i === 0
      ? "Tos nocturna y se cansa en los paseos hace 2 semanas."
      : "Control cardiológico. Menos tos, tolera paseos cortos.",
    exam: i === 0
      ? "Soplo sistólico grado IV/VI foco mitral. FR en reposo 38 rpm. Rx: cardiomegalia izquierda y edema pulmonar leve."
      : "Soplo IV/VI mitral. FR en reposo 24 rpm. Sin crepitaciones.",
    dx: "Enfermedad valvular mitral degenerativa, estadio C.",
    tx: "Furosemida y restricción de ejercicio. Medir FR en reposo en casa (avisar si > 35).",
    rx: [["Furosemida 40 mg", "1 comprimido", "Cada 12 horas", "Permanente hasta control", "Siempre con agua disponible."]],
  }),
  peso: (p, i) => ({
    services: [["Control", 1]],
    anamnesis: i === 0
      ? "Tutora consulta por sobrepeso; se cansa en los paseos."
      : "Control del programa de baja de peso. Cumple la ración indicada.",
    exam: `CC ${i < 2 ? "8/9" : i < 4 ? "7/9" : "6/9"}. Resto del examen sin alteraciones.`,
    dx: "Obesidad canina, programa de reducción de peso.",
    tx: "Ración medida (balanza), 2 paseos diarios de 30 min, sin premios de mesa. Control mensual.",
  }),
  dental: () => ({
    services: [["Hemograma + perfil bioquímico", 1], ["Profilaxis dental", 1]],
    products: [["Catéter intravenoso 22G", 1], ["Suero Ringer lactato 500 ml", 1], ["Amoxicilina 500 mg (comprimido)", 10]],
    anamnesis: "Mal aliento y sarro abundante. Come por un solo lado.",
    exam: "Cálculo dental grado 3, gingivitis marcada. Movilidad de PM superior derecho.",
    dx: "Enfermedad periodontal grado 3.",
    tx: "Destartraje, pulido y extracción de 2 piezas. Antibiótico 7 días, alimento blando 3 días.",
    rx: [["Amoxicilina 500 mg", "½ comprimido", "Cada 12 horas", "7 días", "Dar con comida blanda."]],
  }),
  senior: () => ({
    services: [["Consulta general", 1], ["Hemograma + perfil bioquímico", 1]],
    anamnesis: "Chequeo geriátrico. Duerme más y le cuesta subir escaleras.",
    exam: "CC 6/9. Crepitación leve en caderas. Opacidad cristaliniana bilateral leve.",
    dx: "Paciente geriátrico. Osteoartrosis de cadera. Esclerosis nuclear.",
    tx: "Exámenes dentro de rangos. Suplemento articular y control semestral.",
  }),
  conejo: () => ({
    services: [["Consulta general", 1]],
    anamnesis: "Control sano. Dieta en base a heno y verduras.",
    exam: "Buena condición. Incisivos de largo adecuado. Heces normales.",
    dx: "Paciente sano.",
    tx: "Mantener heno ad libitum. Corte de uñas realizado.",
  }),
  cuy: () => ({
    services: [["Consulta general", 1]],
    products: [["Meloxicam 1,5 mg/ml gotas", 1]],
    anamnesis: "Come menos hace 3 días y babea.",
    exam: "Sobrecrecimiento de premolares con puente lingual. Deshidratación leve.",
    dx: "Maloclusión dental (premolares).",
    tx: "Limado dental bajo sedación. Alimentación asistida 3 días y vitamina C.",
    rx: [["Meloxicam 1,5 mg/ml gotas", "0,05 ml", "Cada 24 horas", "3 días", "Directo en la boca con jeringa."]],
  }),
  ave: () => ({
    services: [["Consulta general", 1]],
    anamnesis: "Control sano. Dieta de semillas y fruta.",
    exam: "Plumaje en buen estado. Quilla bien cubierta. Uñas y pico largos.",
    dx: "Paciente sano. Se recomienda pasar a dieta peletizada.",
    tx: "Corte de uñas y pico. Transición gradual a pellets.",
  }),
  urgenciaParvo: () => ({
    services: [["Atención de urgencia", 1], ["Test rápido parvovirus", 1]],
    anamnesis: "Vómitos y diarrea con sangre hace 48 h. No come y está decaído. Sin vacunas.",
    exam: "Decaído, deshidratación 8%. Temperatura elevada. Dolor abdominal difuso.",
    dx: "Gastroenteritis hemorrágica. Test rápido de parvovirus positivo.",
    tx: "Se indica hospitalización con aislamiento y fluidoterapia.",
  }),
  urgenciaObstruccion: () => ({
    services: [["Atención de urgencia", 1], ["Ecografía abdominal", 1]],
    anamnesis: "Intenta orinar sin éxito desde anoche, vocaliza y se lame los genitales.",
    exam: "Vejiga distendida y dolorosa. Bradicardia leve (150 lpm).",
    dx: "Obstrucción uretral felina.",
    tx: "Sedación, desobstrucción y sondaje. Se hospitaliza.",
  }),
  urgenciaHernia: () => ({
    services: [["Atención de urgencia", 1], ["Radiografía (2 proyecciones)", 1]],
    anamnesis: "No quiere caminar y llora al tomarlo en brazos. Arrastra las patas traseras desde la mañana.",
    exam: "Dolor toracolumbar. Paraparesia ambulatoria, propiocepción disminuida en MP.",
    dx: "Sospecha de hernia discal toracolumbar (Hansen tipo I).",
    tx: "Hospitalización para manejo médico: reposo estricto, analgesia y antiinflamatorio.",
  }),
  controlAlta: () => ({
    services: [["Control", 1]],
    anamnesis: "Control post hospitalización. Evoluciona bien en casa.",
    exam: "Paciente alerta, hidratado. Sin dolor a la palpación.",
    dx: "Evolución favorable.",
    tx: "Mantener indicaciones. Próximo control en 2 semanas.",
  }),
  microchip: () => ({
    services: [["Microchip (implantación)", 1]],
    anamnesis: "Tutor solicita implantación de microchip (Ley de Tenencia Responsable).",
    exam: EXAM_OK,
    dx: "Paciente sano.",
    tx: "Microchip implantado en región interescapular y registrado.",
  }),
};

// ---------------------------------------------------------------------------
// Mascotas y su historial planificado
// ---------------------------------------------------------------------------

// Fechas de las visitas recurrentes: cada `every` días desde `from` hasta `to`
function every(from, to, step, jitter = 3) {
  const out = [];
  for (let o = from; o <= to; o += step) out.push(Math.min(to, o + between(-jitter, jitter)));
  return out;
}
const series = (offsets, template) => offsets.map((o, i) => [o, template, i]);

// weight: [[offset, gramos], ...] interpolado linealmente (más un poco de ruido)
const PETS = [
  { tutor: 0, name: "Rocco", species: "perro", breed: "Labrador retriever", sex: "macho", age: 6.2, color: "Amarillo", sterilized: 1, vet: "crojas",
    weight: [[-185, 37200], [0, 32900]], antiparasitic: "NexGard 10-25 kg (comprimido)",
    plan: [...series(every(-180, -10, 30, 2), "peso"), [-95, "vacunaPerroRabia"], [-61, "otitis"], [-47, "otitisControl"]],
    next: [9, "Control programa de peso"] },
  { tutor: 0, name: "Luna", species: "gato", breed: "Doméstico pelo corto", sex: "hembra", age: 3.1, color: "Atigrada gris", sterilized: 1, vet: "vsoto",
    weight: [[-400, 4000], [0, 4150]],
    plan: [[-372, "vacunaGato"], [-88, "desparasitacion"], [0, "pipetaGato"]] },
  { tutor: 1, name: "Thor", species: "perro", breed: "Pastor alemán", sex: "macho", age: 4.4, color: "Negro y fuego", sterilized: 0, vet: "mcontreras",
    allergies: "Proteína de pollo (dieta hipoalergénica)", weight: [[-180, 36500], [0, 38200]],
    antiparasitic: "Bravecto 20-40 kg (comprimido)",
    plan: [[-168, "dermatitis"], [-150, "dermControl"], [-121, "vacunaPerroRabia"], [-75, "dermatitis"], [-60, "dermControl"], [-6, "otitis"]],
    next: [8, "Control otitis"] },
  { tutor: 2, name: "Canela", species: "perro", breed: "Mestizo", sex: "hembra", age: 8.0, color: "Café claro", sterilized: 1, vet: "crojas",
    weight: [[-180, 17800], [0, 18400]], antiparasitic: "NexGard 10-25 kg (comprimido)",
    plan: [...series(every(-176, -2, 35), "grooming"), [-130, "senior"], [-42, "dental"]],
    next: [27, "Peluquería"] },
  { tutor: 2, name: "Pimienta", species: "gato", breed: "Doméstico pelo corto", sex: "hembra", age: 5.0, color: "Negra", sterilized: 1, vet: "vsoto",
    weight: [[-400, 3900], [0, 4000]],
    plan: [[-352, "vacunaGatoLeucemia"]] },
  { tutor: 3, name: "Maki", species: "perro", breed: "Bulldog francés", sex: "macho", age: 2.3, color: "Atigrado", sterilized: 1, vet: "mcontreras",
    allergies: "Dermatitis atópica; sensible a la amoxicilina (vómitos)", weight: [[-180, 11800], [0, 12600]],
    antiparasitic: "Simparica 10-20 kg (comprimido)",
    plan: [...series(every(-165, -15, 30), "grooming"), [-140, "conjuntivitis"], [-98, "vacunaPerro"], [-33, "dermatitis"]],
    next: [-4, "Control dermatitis"] },
  { tutor: 4, name: "Oliver", species: "gato", breed: "Persa", sex: "macho", age: 11.5, color: "Blanco", sterilized: 1, vet: "vsoto",
    weight: [[-180, 4650], [0, 4020]], notes: "Paciente renal crónico. Manejo con fluidoterapia SC en casa.",
    plan: [...series(every(-170, -12, 30, 2), "renal"), [-140, "vacunaGato"]],
    next: [16, "Control renal + exámenes"] },
  { tutor: 5, name: "Toby", species: "perro", breed: "Mestizo", sex: "macho", age: 0.35, color: "Negro con blanco", sterilized: 0, vet: "crojas",
    weight: [[-45, 3600], [-4, 6200], [0, 5800]],
    plan: [[-40, "puppy1"], [-3, "urgenciaParvo"]] },
  { tutor: 6, name: "Nala", species: "perro", breed: "Golden retriever", sex: "hembra", age: 0.62, color: "Dorado", sterilized: 1, vet: "crojas",
    weight: [[-175, 5800], [-110, 12900], [-30, 21200], [0, 23400]],
    antiparasitic: "NexGard 10-25 kg (comprimido)",
    plan: [[-172, "puppy1"], [-151, "puppy2"], [-130, "puppy3"], [-109, "puppyRabia"], [-80, "desparasitacion"], [-29, "esterilizacion"], [-19, "postop"], [-109, "microchip"]],
    next: [32, "Desparasitación"] },
  { tutor: 7, name: "Simón", species: "gato", breed: "Siamés", sex: "macho", age: 9.2, color: "Seal point", sterilized: 1, vet: "vsoto",
    weight: [[-150, 6300], [-90, 5500], [0, 5700]], notes: "Diabético. Insulina 2 UI c/12 h.",
    plan: series([-150, -136, -115, -90, -62, -35, -8], "diabetes"),
    next: [20, "Curva de glucosa"] },
  { tutor: 7, name: "Kiara", species: "perro", breed: "Beagle", sex: "hembra", age: 5.0, color: "Tricolor", sterilized: 1, vet: "mcontreras",
    weight: [[-400, 13800], [0, 14600]],
    plan: [[-380, "vacunaPerroRabia"], [-66, "gastro"]] },
  { tutor: 8, name: "Copito", species: "conejo", breed: "Cabeza de león", sex: "macho", age: 2.0, color: "Blanco", sterilized: 1, vet: "vsoto",
    weight: [[-180, 1650], [0, 1820]],
    plan: [[-150, "conejo"], [-20, "conejo"]] },
  { tutor: 9, name: "Max", species: "perro", breed: "Golden retriever", sex: "macho", age: 10.4, color: "Dorado", sterilized: 1, vet: "crojas",
    weight: [[-180, 33800], [0, 31600]], notes: "Cardiópata (EVMD estadio C).",
    plan: [[-170, "senior"], ...series([-120, -92, -60, -30, -5], "cardio"), [-140, "vacunaPerro"]],
    next: [23, "Control cardiológico"] },
  { tutor: 10, name: "Mía", species: "gato", breed: "Doméstico pelo largo", sex: "hembra", age: 0.9, color: "Calicó", sterilized: 1, vet: "vsoto",
    weight: [[-170, 1400], [-60, 3100], [0, 3500]],
    plan: [[-168, "kitten1"], [-147, "vacunaGato"], [-124, "vacunaGatoLeucemia"], [-50, "esterilizacion"], [-40, "postop"]],
    next: [70, "Refuerzo anual pendiente"] },
  { tutor: 10, name: "Milo", species: "gato", breed: "Doméstico pelo corto", sex: "macho", age: 0.9, color: "Naranjo", sterilized: 1, vet: "vsoto",
    weight: [[-170, 1500], [-60, 3600], [0, 4300]],
    plan: [[-168, "kitten1"], [-147, "vacunaGato"], [-124, "vacunaGatoLeucemia"], [-57, "esterilizacion"], [-47, "postop"], [-14, "pipetaGato"]] },
  { tutor: 11, name: "Bruno", species: "perro", breed: "Bóxer", sex: "macho", age: 7.0, color: "Atigrado", sterilized: 0, vet: "mcontreras",
    weight: [[-180, 31000], [0, 31800]],
    plan: [[-155, "tos"], [-112, "vacunaPerroRabia"], [-23, "herida"], [-13, "postop"]] },
  { tutor: 11, name: "Rambo", species: "perro", breed: "Mestizo", sex: "macho", age: 11.0, color: "Negro", sterilized: 1, vet: "mcontreras",
    weight: [[-520, 22000], [-450, 22500]], inactive: true,
    plan: [[-520, "otitis"], [-455, "gastro"]] },
  { tutor: 12, name: "Kiwi", species: "ave", breed: "Cotorra australiana", sex: "macho", age: 1.5, color: "Verde y amarillo", sterilized: 0, vet: "vsoto",
    weight: [[-180, 88], [0, 92]],
    plan: [[-60, "ave"]] },
  { tutor: 13, name: "Chester", species: "perro", breed: "Schnauzer miniatura", sex: "macho", age: 9.0, color: "Sal y pimienta", sterilized: 1, vet: "crojas",
    allergies: "Pancreatitis previa: no dar alimentos grasos", weight: [[-180, 9100], [0, 8700]],
    antiparasitic: "NexGard 4-10 kg (comprimido)",
    plan: [...series(every(-172, -8, 32), "grooming"), [-103, "gastro"], [-150, "vacunaPerro"]],
    next: [24, "Peluquería"] },
  { tutor: 14, name: "Frida", species: "perro", breed: "Poodle toy", sex: "hembra", age: 12.3, color: "Blanco", sterilized: 1, vet: "crojas",
    weight: [[-180, 3400], [0, 3250]],
    plan: [...series(every(-160, -6, 40), "grooming"), [-118, "dental"], [-108, "postop"], [-70, "senior"]],
    next: [-9, "Control geriátrico"] },
  { tutor: 14, name: "Coco", species: "perro", breed: "Poodle toy", sex: "macho", age: 6.0, color: "Damasco", sterilized: 1, vet: "crojas",
    weight: [[-180, 4200], [0, 4350]], antiparasitic: "NexGard 4-10 kg (comprimido)",
    plan: [...series(every(-160, -6, 40), "grooming"), [-355, "vacunaPerroRabia"]],
    next: [34, "Peluquería"] },
  { tutor: 15, name: "Simba", species: "gato", breed: "Maine coon", sex: "macho", age: 3.0, color: "Atigrado café", sterilized: 1, vet: "vsoto",
    weight: [[-180, 7200], [0, 7600]],
    plan: [[-133, "cistitis"], [-120, "controlAlta"], [-15, "vacunaGato"]] },
  { tutor: 16, name: "Lola", species: "perro", breed: "Shih tzu", sex: "hembra", age: 5.0, color: "Blanco y café", sterilized: 1, vet: "mcontreras",
    weight: [[-180, 6100], [0, 6400]], antiparasitic: "NexGard 4-10 kg (comprimido)",
    plan: [...series(every(-178, 0, 28), "grooming"), [-84, "conjuntivitis"], [-360, "vacunaPerro"]],
    next: [27, "Peluquería"] },
  { tutor: 16, name: "Bobby", species: "perro", breed: "Yorkshire terrier", sex: "macho", age: 3.0, color: "Azul y fuego", sterilized: 1, vet: "mcontreras",
    weight: [[-180, 2900], [0, 3100]], antiparasitic: "NexGard 4-10 kg (comprimido)",
    plan: [...series(every(-178, 0, 28), "grooming"), [-143, "vacunaPerroRabia"]],
    next: [27, "Peluquería"] },
  { tutor: 17, name: "Zeus", species: "perro", breed: "Rottweiler", sex: "macho", age: 3.2, color: "Negro y fuego", sterilized: 0, vet: "mcontreras",
    weight: [[-180, 44000], [0, 46500]], antiparasitic: "Bravecto 20-40 kg (comprimido)",
    plan: [[-100, "vacunaPerroRabia"], [-38, "cojera"], [-24, "controlAlta"]],
    next: [5, "Control rodilla izquierda"] },
  { tutor: 18, name: "Pelusa", species: "roedor", breed: "Cuy (cobayo)", sex: "hembra", age: 2.0, color: "Blanco y café", sterilized: 0, vet: "vsoto",
    weight: [[-180, 980], [-30, 860], [0, 930]],
    plan: [[-31, "cuy"], [-24, "controlAlta"]] },
  { tutor: 18, name: "Michi", species: "gato", breed: "Doméstico pelo corto", sex: "hembra", age: 7.0, color: "Gris", sterilized: 1, vet: "vsoto",
    weight: [[-400, 4500], [0, 4700]],
    plan: [[-390, "vacunaGato"]] },
  { tutor: 19, name: "Rocky", species: "perro", breed: "American Staffordshire", sex: "macho", age: 5.0, color: "Azul", sterilized: 0, vet: "mcontreras",
    weight: [[-180, 27500], [0, 28100]],
    plan: [[-131, "herida"], [-121, "postop"], [-12, "vacunaPerroRabia"]] },
  { tutor: 20, name: "Garfield", species: "gato", breed: "Doméstico pelo corto", sex: "macho", age: 5.0, color: "Naranjo", sterilized: 1, vet: "vsoto",
    weight: [[-180, 6400], [-46, 6200], [-40, 5900], [0, 6000]], notes: "Antecedente de obstrucción uretral. Dieta urinaria permanente.",
    plan: [[-46, "urgenciaObstruccion"], [-37, "controlAlta"], [-17, "controlAlta"], [-160, "vacunaGato"]],
    next: [45, "Control urinario"] },
  { tutor: 21, name: "Bella", species: "perro", breed: "Cocker spaniel inglés", sex: "hembra", age: 6.0, color: "Dorado", sterilized: 1, vet: "crojas",
    weight: [[-180, 13200], [0, 13700]], antiparasitic: "Simparica 10-20 kg (comprimido)",
    plan: [[-162, "otitis"], [-148, "otitisControl"], [-90, "otitis"], [-76, "otitisControl"], [-125, "vacunaPerroRabia"], ...series(every(-170, -20, 45), "grooming")],
    next: [2, "Control otitis crónica"] },
  { tutor: 22, name: "Luna", species: "perro", breed: "Border collie", sex: "hembra", age: 2.0, color: "Negro y blanco", sterilized: 1, vet: "crojas",
    weight: [[-180, 16800], [0, 17400]], antiparasitic: "Simparica 10-20 kg (comprimido)",
    plan: [[-140, "vacunaPerroRabia"], [-52, "tos"], [-35, "desparasitacion"]] },
  { tutor: 23, name: "Tito", species: "perro", breed: "Dachshund", sex: "macho", age: 8.0, color: "Rojo", sterilized: 1, vet: "crojas",
    weight: [[-180, 9400], [-108, 9100], [0, 8700]], notes: "Hernia discal T13-L1 (manejo médico). Evitar escaleras y saltos.",
    plan: [[-110, "urgenciaHernia"], [-98, "controlAlta"], [-70, "controlAlta"], [-21, "senior"]],
    next: [1, "Control neurológico"] },
  { tutor: 24, name: "Pirata", species: "gato", breed: "Doméstico pelo corto", sex: "macho", age: 14.0, color: "Blanco y negro", sterilized: 1, vet: "vsoto",
    weight: [[-500, 4300], [-430, 4100]], inactive: true,
    plan: [[-500, "conjuntivitis"], [-430, "senior"]] },
  { tutor: 24, name: "Princesa", species: "perro", breed: "Maltés", sex: "hembra", age: 13.0, color: "Blanco", sterilized: 1, vet: "crojas",
    weight: [[-480, 3800], [-400, 3700]], inactive: true,
    plan: [[-480, "dental"], [-400, "otitis"]] },
  { tutor: 25, name: "Duque", species: "perro", breed: "Mestizo", sex: "macho", age: 9.0, color: "Café", sterilized: 1, vet: "mcontreras",
    weight: [[-600, 24000], [-560, 24500]], inactive: true,
    plan: [[-560, "cojera"]] },
  { tutor: 19, name: "Nina", species: "perro", breed: "Mestiza", sex: "hembra", age: 1.0, color: "Blanca con manchas", sterilized: 1, vet: "mcontreras",
    weight: [[-120, 9800], [0, 12100]],
    plan: [[-116, "puppyRabia"], [-60, "esterilizacion"], [-50, "postop"], [-2, "desparasitacion"]] },
  { tutor: 3, name: "Olivia", species: "gato", breed: "Ragdoll", sex: "hembra", age: 1.4, color: "Blue point", sterilized: 1, vet: "vsoto",
    weight: [[-180, 3200], [0, 3900]],
    plan: [[-150, "vacunaGatoLeucemia"], [-1, "pipetaGato"]] },
];

// Pacientes ocasionales: vacuna anual, alguna consulta y, a veces, peluquería
const OCCASIONAL = [
  ["Rufo", "perro", "Mestizo", "macho", 4, "Café atigrado", 21000],
  ["Benito", "perro", "Pug", "macho", 3, "Beige", 8600],
  ["Sasha", "perro", "Husky siberiano", "hembra", 5, "Gris y blanco", 22500],
  ["Chispa", "perro", "Jack Russell terrier", "hembra", 7, "Blanco y café", 6800],
  ["Nieve", "gato", "Angora turco", "hembra", 4, "Blanca", 3600],
  ["Oso", "perro", "Chow chow", "macho", 6, "Rojizo", 27000],
  ["Panchita", "perro", "Mestiza", "hembra", 9, "Negra", 14200],
  ["Tom", "gato", "Doméstico pelo corto", "macho", 6, "Atigrado gris", 5400],
  ["Lucas", "perro", "Labrador retriever", "macho", 2, "Chocolate", 31000],
  ["Kira", "perro", "Pastor australiano", "hembra", 3, "Blue merle", 19500],
  ["Mochi", "gato", "British shorthair", "hembra", 2, "Gris azulado", 4300],
  ["Pancho", "perro", "Mestizo", "macho", 6, "Blanco y negro", 16000],
  ["Cleo", "gato", "Bengalí", "hembra", 3, "Manchado", 4100],
  ["Teo", "perro", "Cocker spaniel inglés", "macho", 4, "Negro", 14000],
  ["Lucky", "perro", "Mestizo", "macho", 5, "Canela", 12500],
  ["Amapola", "gato", "Doméstico pelo largo", "hembra", 8, "Carey", 3900],
  ["Jack", "perro", "Border collie", "macho", 6, "Negro y blanco", 18800],
  ["Frodo", "perro", "Bichón frisé", "macho", 4, "Blanco", 6200],
  ["Maya", "perro", "Labrador retriever", "hembra", 8, "Negra", 29500],
  ["Gaspar", "gato", "Doméstico pelo corto", "macho", 2, "Negro", 5000],
  ["Charlie", "perro", "Beagle", "macho", 3, "Tricolor", 13200],
  ["Úrsula", "perro", "Shih tzu", "hembra", 7, "Dorado y blanco", 6900],
];
OCCASIONAL.forEach(([name, species, breed, sex, age, color, grams], i) => {
  const dog = species === "perro";
  const acute = dog
    ? ["gastro", "otitis", "conjuntivitis", "tos", "desparasitacion", "dermatitis", "cojera"]
    : ["cistitis", "conjuntivitis", "desparasitacion", "pipetaGato"];
  const plan = [[-between(20, 170), dog ? "vacunaPerroRabia" : "vacunaGato"]];
  for (let k = between(1, 3); k > 0; k--) {
    // Más visitas en los meses recientes: la clínica viene creciendo
    const o = -Math.floor(175 * rand() ** 1.25);
    plan.push([o, pick(acute)]);
    if (chance(0.5)) plan.push([o + 12, pick(["otitisControl", "controlAlta"])].map((x, j) => (j === 0 ? Math.min(0, x) : x)));
  }
  if (dog && chance(0.6)) plan.push(...series(every(-between(150, 175), -between(1, 20), between(35, 50)), "grooming"));
  PETS.push({
    tutor: 26 + i, name, species, breed, sex, age, color, sterilized: chance(0.7) ? 1 : 0,
    vet: dog ? pick(["crojas", "mcontreras"]) : "vsoto", weight: [[-180, Math.round(grams * 0.97)], [0, grams]],
    antiparasitic: dog ? (grams > 10000 ? "NexGard 10-25 kg (comprimido)" : "NexGard 4-10 kg (comprimido)") : undefined,
    plan,
  });
});

// Visitas extra de pacientes frecuentes y las atenciones de hoy
const extraVisits = {
  Thor: series(every(-170, -20, 35), "grooming"),
  Kiara: series(every(-160, -10, 45), "grooming"),
  Max: series(every(-150, -15, 50), "grooming"),
  Nina: series(every(-100, -10, 45), "grooming"),
  Bobby: [[0, "grooming"]],
  Rocky: [[0, "gastro"], [-75, "otitis"]],
  Simba: [[0, "conjuntivitis"]],
  Zeus: [[-140, "gastro"]],
  Copito: [[-90, "conjuntivitis"]],
  Kira: [[-172, "esterilizacion"], [-162, "postop"]],
  Oso: [[-168, "dental"]],
  Maya: [[-176, "senior"]],
};
for (const pet of PETS) {
  if (extraVisits[pet.name] && !pet.inactive) pet.plan.push(...extraVisits[pet.name]);
}

const insertPet = db.prepare(
  `INSERT INTO pets (tutor_id, name, species, breed, sex, birth_date, weight_grams, microchip, color,
     allergies, next_visit_date, next_visit_note, sterilized, notes, created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
);

function weightAt(pet, offset) {
  const pts = pet.weight;
  let grams = pts[0][1];
  if (offset >= pts[pts.length - 1][0]) grams = pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, wa] = pts[i];
    const [b, wb] = pts[i + 1];
    if (offset >= a && offset <= b) grams = wa + ((wb - wa) * (offset - a)) / (b - a);
  }
  const noise = 1 + (rand() - 0.5) * 0.015;
  return Math.round((grams * noise) / (grams < 1000 ? 1 : 10)) * (grams < 1000 ? 1 : 10);
}

const VITALS = {
  perro: { temp: [38.1, 39.1], hr: [70, 120], rr: [16, 30] },
  gato: { temp: [38.0, 39.0], hr: [150, 200], rr: [20, 32] },
  conejo: { temp: [38.5, 39.6], hr: [180, 250], rr: [32, 56] },
  roedor: { temp: [37.5, 39.0], hr: [230, 300], rr: [42, 80] },
  ave: { temp: [40.0, 41.5], hr: [250, 350], rr: [40, 60] },
};

for (const pet of PETS) {
  const years = pet.age;
  const birth = dateAt(-Math.round(years * 365.25) - between(0, 20));
  const lastWeight = pet.weight[pet.weight.length - 1][1];
  // Microchip: obligatorio en perros y gatos (Ley 21.020); no todos lo tienen al día
  const chip =
    pet.plan.some(([, key]) => key === "microchip") ||
    ((pet.species === "perro" || pet.species === "gato") && !pet.inactive && chance(0.8))
      ? `9820000${String(between(10000000, 99999999))}`
      : null;
  pet.tutorRow = tutors[pet.tutor];
  pet.weightKg = lastWeight / 1000;
  pet.id = insertPet
    .run(
      pet.tutorRow.id, pet.name, pet.species, pet.breed, pet.sex, iso(birth), lastWeight, chip, pet.color,
      pet.allergies ?? null, pet.next ? day(pet.next[0]) : null, pet.next?.[1] ?? null,
      pet.sterilized, pet.notes ?? null, dateTime(Math.min(...pet.plan.map(([o]) => o)) - 1)
    )
    .lastInsertRowid;
}

// ---------------------------------------------------------------------------
// Atenciones (con stock, recetas, vacunas y pagos)
// ---------------------------------------------------------------------------

const insertAttention = db.prepare(
  `INSERT INTO attentions (pet_name, owner_name, tutor_id, pet_id, vet_id, weight_grams, temperature,
     heart_rate, resp_rate, mucous, anamnesis, exam_findings, diagnosis, treatment, date, notes,
     discount, total, created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
);
const insertAttService = db.prepare(
  "INSERT INTO attention_services (attention_id, service_id, quantity, unit_price) VALUES (?,?,?,?)"
);
const insertAttProduct = db.prepare(
  "INSERT INTO attention_products (attention_id, product_id, quantity, unit_price) VALUES (?,?,?,?)"
);
const insertPrescription = db.prepare(
  "INSERT INTO prescriptions (pet_id, tutor_id, vet_id, attention_id, date, notes, created_at) VALUES (?,?,?,?,?,?,?)"
);
const insertRxItem = db.prepare(
  `INSERT INTO prescription_items (prescription_id, medication, dose, frequency, duration, instructions)
   VALUES (?,?,?,?,?,?)`
);
const insertPayment = db.prepare(
  "INSERT INTO payments (attention_id, hospitalization_id, amount, method, date, user_id, created_at) VALUES (?,?,?,?,?,?,?)"
);

const consumed = new Map(); // productId -> [{ offset, qty }]
function consume(productId, qty, offset) {
  if (!consumed.has(productId)) consumed.set(productId, []);
  consumed.get(productId).push({ offset, qty });
}

const healthRecords = [];
const attentionsByPet = new Map();
const visits = [];
const firstMonth = new Date(T.getFullYear(), T.getMonth() - 5, 1);
const historyScale = Math.round((T - firstMonth) / 86400000) / 186;

for (const pet of PETS) {
  for (const [rawOffset, key, index = 0] of pet.plan) {
    // Los planes cubren 185 días; se ajustan al período desde el día 1 de hace 5 meses.
    // Las visitas más antiguas (vacunas del año pasado, inactivos) quedan tal cual.
    const offset = rawOffset >= -185 ? Math.round(rawOffset * historyScale) : rawOffset;
    visits.push({ pet, offset: openDay(Math.min(0, offset)), key, index });
  }
}
// Evitar dos atenciones de la misma mascota el mismo día
visits.sort((a, b) => a.offset - b.offset);
const usedPetDays = new Set();
for (const v of visits) {
  while (usedPetDays.has(`${v.pet.id}:${v.offset}`)) v.offset = openDay(v.offset - 1);
  usedPetDays.add(`${v.pet.id}:${v.offset}`);
}
visits.sort((a, b) => a.offset - b.offset);

function vetFor(pet, offset) {
  if (worksOn(pet.vet, offset)) return pet.vet;
  const order = pet.species === "perro" ? ["crojas", "mcontreras", "vsoto"] : ["vsoto", "crojas", "mcontreras"];
  return order.find((k) => worksOn(k, offset)) ?? "mcontreras";
}

const METHODS = ["debito", "debito", "debito", "debito", "credito", "credito", "efectivo", "efectivo", "transferencia", "transferencia", "transferencia"];
const pendingKeys = new Set(); // atenciones que quedan con deuda
const attentionRows = [];

for (const v of visits) {
  const { pet, offset, key, index } = v;
  const t = TEMPLATES[key](pet, index);
  const vetKey = vetFor(pet, offset);
  const date = day(offset);
  const clinical = t.clinical !== false;
  const vit = VITALS[pet.species];
  const grams = weightAt(pet, offset);
  const temp = clinical && vit ? (vit.temp[0] + rand() * (vit.temp[1] - vit.temp[0])).toFixed(1) : null;
  const hr = clinical && vit ? between(vit.hr[0], vit.hr[1]) : null;
  const rr = clinical && vit ? between(vit.rr[0], vit.rr[1]) : null;

  const lines = [];
  for (const [name, qty] of t.services ?? []) {
    const s = service(name);
    lines.push({ kind: "s", id: s.id, qty, price: s.price });
  }
  for (const [name, qty] of t.products ?? []) {
    const p = product(name);
    lines.push({ kind: "p", id: p.id, qty, price: p.sale_price, category: p.category, name: p.name });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  // Descuento de cliente frecuente en algunas atenciones grandes
  const discount = subtotal >= 60000 && chance(0.35) ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  const attentionId = insertAttention
    .run(
      pet.name, pet.tutorRow.name, pet.tutorRow.id, pet.id, staff[vetKey].id, grams,
      key === "urgenciaParvo" ? "40.1" : temp, hr, rr,
      clinical ? (key === "urgenciaParvo" ? "Pálidas, secas" : "Rosadas, húmedas") : null,
      clinical ? t.anamnesis : null, clinical ? t.exam : null, clinical ? t.dx : null, clinical ? t.tx : null,
      date, t.notes ?? (discount ? "Descuento 10% cliente frecuente." : null), discount, total,
      dateTime(offset, `${String(between(9, 18)).padStart(2, "0")}:${pick(["05", "20", "35", "50"])}`)
    )
    .lastInsertRowid;

  for (const l of lines) {
    if (l.kind === "s") insertAttService.run(attentionId, l.id, l.qty, l.price);
    else {
      insertAttProduct.run(attentionId, l.id, l.qty, l.price);
      consume(l.id, l.qty, offset);
      // La app propone 365 días para vacunas y 30 para antiparasitarios; aquí se
      // usa el intervalo real del producto (Drontal y Bravecto cada 3 meses)
      if (l.category === "vacuna" || l.category === "antiparasitario") {
        const interval = l.category === "vacuna" ? 365 : /^(Drontal|Bravecto)/.test(l.name) ? 90 : 30;
        healthRecords.push({
          petId: pet.id, type: l.category, name: l.name, applied: date,
          offset, next: day(offset + interval), attentionId,
        });
      }
    }
  }

  if (t.rx) {
    const rxId = insertPrescription
      .run(pet.id, pet.tutorRow.id, staff[vetKey].id, attentionId, date,
        key === "esterilizacion" ? "Reposo 10 días. No bañar hasta retirar puntos." : null, dateTime(offset, "13:00"))
      .lastInsertRowid;
    for (const item of t.rx) insertRxItem.run(rxId, ...item);
  }

  const row = { id: attentionId, pet, offset, total, key, vetKey };
  attentionRows.push(row);
  if (!attentionsByPet.has(pet.id)) attentionsByPet.set(pet.id, []);
  attentionsByPet.get(pet.id).push(row);
}

// Pagos: casi todo pagado el mismo día; algunas deudas parciales o pendientes
const DEBTS = [
  // [mascota, plantilla, parte abonada]
  ["Simón", "diabetes", 0], // cliente con cuenta mensual: último control pendiente
  ["Bruno", "herida", 0.5], // urgencia por mordedura: abonó la mitad
  ["Thor", "otitis", 0], // paga al retirar el tratamiento
  ["Tito", "senior", 0.5],
];
const debtShare = new Map();
for (const [petName, key, share] of DEBTS) {
  const row = attentionRows.filter((r) => r.pet.name === petName && r.key === key).at(-1);
  if (row) debtShare.set(row.id, share);
}
for (const row of attentionRows) {
  const userId = chance(0.75) ? staff.recepcion.id : staff[row.vetKey].id;
  if (debtShare.has(row.id)) {
    const share = debtShare.get(row.id);
    pendingKeys.add(row.id);
    if (share > 0) {
      insertPayment.run(row.id, null, Math.round((row.total * share) / 1000) * 1000, pick(["efectivo", "debito"]), day(row.offset), userId, dateTime(row.offset, "18:00"));
    }
    continue;
  }
  // Los pagos grandes a veces se dividen en dos medios
  if (row.total > 70000 && chance(0.4)) {
    const first = Math.round(row.total / 2000) * 1000;
    insertPayment.run(row.id, null, first, "efectivo", day(row.offset), userId, dateTime(row.offset, "18:00"));
    insertPayment.run(row.id, null, row.total - first, "credito", day(row.offset), userId, dateTime(row.offset, "18:01"));
  } else {
    insertPayment.run(row.id, null, row.total, pick(METHODS), day(row.offset), userId, dateTime(row.offset, "18:00"));
  }
}
// Hoy: una atención todavía sin cobrar (el cliente está en sala)
{
  const todayRow = attentionRows.filter((r) => r.offset === 0 && !pendingKeys.has(r.id)).at(-1);
  if (todayRow) db.prepare("DELETE FROM payments WHERE attention_id = ?").run(todayRow.id);
}

// Registros de vacunas aplicadas en otras clínicas (según carnet)
for (const [petName, name, offset] of [
  ["Luna", "Vacuna antirrábica", -340],
  ["Kiara", "Vacuna KC (tos de las perreras)", -395],
  ["Pimienta", "Vacuna antirrábica", -357],
]) {
  const pet = PETS.find((p) => p.name === petName);
  healthRecords.push({
    petId: pet.id, type: "vacuna", name, applied: day(offset), offset, next: day(offset + 365),
    attentionId: null, notes: "Aplicada en otra clínica (según carnet).",
  });
}

// La app no descarta dosis antiguas al registrar una nueva, y los recordatorios
// las mostrarían como vencidas: se deja la próxima fecha solo en la última dosis
const latest = new Map();
for (const r of healthRecords) {
  const k = `${r.petId}:${r.name}`;
  if (!latest.has(k) || latest.get(k).offset < r.offset) latest.set(k, r);
}
const insertHealth = db.prepare(
  `INSERT INTO pet_health_records (pet_id, type, name, applied_date, next_due_date, attention_id, notes, created_at)
   VALUES (?,?,?,?,?,?,?,?)`
);
for (const r of healthRecords) {
  const next = latest.get(`${r.petId}:${r.name}`) === r ? r.next : null;
  insertHealth.run(r.petId, r.type, r.name, r.applied, next, r.attentionId, r.notes ?? null, dateTime(r.offset));
}

// Peso actual = último registrado
for (const pet of PETS) {
  const last = db
    .prepare("SELECT weight_grams w FROM attentions WHERE pet_id = ? AND weight_grams IS NOT NULL ORDER BY date DESC LIMIT 1")
    .get(pet.id);
  if (last) db.prepare("UPDATE pets SET weight_grams = ? WHERE id = ?").run(last.w, pet.id);
}

// Una receta emitida sin atención (renovación de tratamiento crónico). Como en
// la app, el medicamento nuevo entra al catálogo solo para el autocompletado.
{
  db.prepare("INSERT INTO products (name, category, tracked) VALUES (?, 'medicamento', 0)").run("Pimobendan 5 mg");
  const max = PETS.find((p) => p.name === "Max");
  const rxId = insertPrescription
    .run(max.id, max.tutorRow.id, staff.crojas.id, null, day(-1), "Renovación de receta para farmacia.", dateTime(-1, "17:30"))
    .lastInsertRowid;
  insertRxItem.run(rxId, "Furosemida 40 mg", "1 comprimido", "Cada 12 horas", "30 días", "Siempre con agua disponible.");
  insertRxItem.run(rxId, "Pimobendan 5 mg", "1 comprimido", "Cada 12 horas", "30 días", "Dar 1 hora antes de las comidas.");
}

// ---------------------------------------------------------------------------
// Hospitalizaciones
// ---------------------------------------------------------------------------

const insertHosp = db.prepare(
  `INSERT INTO hospitalizations (pet_id, tutor_id, vet_id, admitted_at, reason, diagnosis, status,
     discharged_at, notes, total, created_at)
   VALUES (?,?,?,?,?,?,?,?,?,0,?)`
);
const insertLog = db.prepare(
  `INSERT INTO hospitalization_logs (hospitalization_id, date, weight_grams, temperature, heart_rate,
     resp_rate, treatment, notes, created_at)
   VALUES (?,?,?,?,?,?,?,?,?)`
);
const insertCharge = db.prepare(
  `INSERT INTO hospitalization_charges (hospitalization_id, product_id, description, quantity, unit_price, created_at)
   VALUES (?,?,?,?,?,?)`
);

function hospitalize({ petName, vet, admitted, discharged, reason, diagnosis, notes, logs, charges, payments }) {
  const pet = PETS.find((p) => p.name === petName && !p.inactive);
  const hospId = insertHosp
    .run(pet.id, pet.tutorRow.id, staff[vet].id, day(admitted), reason, diagnosis,
      discharged == null ? "activa" : "alta", discharged == null ? null : day(discharged), notes, dateTime(admitted, "11:00"))
    .lastInsertRowid;
  for (const [offset, hhmm, kg, temp, hr, rr, treatment, note] of logs) {
    insertLog.run(hospId, day(offset), kg ? Math.round(kg * 1000) : null, temp, hr, rr, treatment, note, dateTime(offset, hhmm));
  }
  for (const [offset, name, qty, manualPrice] of charges) {
    if (manualPrice) {
      insertCharge.run(hospId, null, name, qty, manualPrice, dateTime(offset, "20:00"));
    } else {
      const p = product(name);
      insertCharge.run(hospId, p.id, p.name, qty, p.sale_price, dateTime(offset, "20:00"));
      consume(p.id, qty, offset);
    }
  }
  db.prepare(
    "UPDATE hospitalizations SET total = (SELECT coalesce(sum(quantity * unit_price), 0) FROM hospitalization_charges WHERE hospitalization_id = ?) WHERE id = ?"
  ).run(hospId, hospId);
  for (const [offset, amount, method] of payments) {
    insertPayment.run(null, hospId, amount, method, day(offset), staff.recepcion.id, dateTime(offset, "18:30"));
  }
  return hospId;
}

// Activa: cachorro con parvovirus, ingresó hace 3 días
const toby = PETS.find((p) => p.name === "Toby");
const tobyAdmit = attentionsByPet.get(toby.id).at(-1).offset;
hospitalize({
  petName: "Toby", vet: "crojas", admitted: tobyAdmit, discharged: null,
  reason: "Vómitos y diarrea hemorrágica de 48 h, anorexia y decaimiento.",
  diagnosis: "Parvovirus canino (test rápido positivo). Deshidratación 8%.",
  notes: "Aislamiento. Tutor autoriza tratamiento completo. Visitas 17:00-18:00.",
  logs: [
    [tobyAdmit, "13:00", 6.1, "40.1", 168, 40, "Catéter cefálico. Ringer lactato 40 ml/h. Ondansetrón IV. Ranitidina IV.", "Ingreso. Muy decaído, vomitó 2 veces."],
    [tobyAdmit, "21:00", null, "39.8", 160, 36, "Fluidoterapia continua. Metronidazol IV.", "Diarrea hemorrágica x2."],
    [tobyAdmit + 1, "08:30", 5.8, "39.6", 152, 34, "Ringer lactato 35 ml/h. Ondansetrón IV c/12 h.", "Sin vómitos en la noche. Diarrea x1."],
    [tobyAdmit + 1, "20:00", null, "39.3", 148, 32, "Se agrega glucosa al 2,5% al fluido.", "Más alerta, mueve la cola."],
    [tobyAdmit + 2, "08:30", 5.7, "39.0", 140, 30, "Fluidoterapia 30 ml/h. Ofrecer agua en pequeñas cantidades.", "Toleró agua. Deposición pastosa sin sangre."],
    [tobyAdmit + 2, "20:00", null, "38.8", 136, 28, "Se ofrece dieta gastrointestinal húmeda.", "Comió una cucharada."],
    ...(tobyAdmit + 3 <= 0
      ? [[tobyAdmit + 3, "08:30", 5.8, "38.6", 130, 26, "Fluidoterapia 20 ml/h. Dieta GI 4 veces al día.", "Come con apetito. Pronóstico favorable, posible alta en 48 h."]]
      : []),
  ],
  charges: [
    [tobyAdmit, "Hospitalización con aislamiento (día)", Math.max(1, -tobyAdmit + 1), 28000],
    [tobyAdmit, "Catéter intravenoso 22G", 2],
    [tobyAdmit, "Suero Ringer lactato 500 ml", 6],
    [tobyAdmit, "Ranitidina inyectable", 2],
    [tobyAdmit, "Ondansetrón inyectable (dosis)", 5, 4500],
    [tobyAdmit, "Metronidazol inyectable (dosis)", 4, 3800],
    [tobyAdmit + 1, "Jeringa 5 ml", 12],
    [tobyAdmit + 1, "Guantes de látex (par)", 10],
    [tobyAdmit + 2, "Dieta gastrointestinal perro 2 kg", 1],
  ],
  payments: [[tobyAdmit, 100000, "transferencia"]],
});

// Alta: gato con obstrucción uretral
const garfield = PETS.find((p) => p.name === "Garfield");
const garfieldAdmit = attentionsByPet.get(garfield.id).find((r) => r.key === "urgenciaObstruccion").offset;
{
  const a = garfieldAdmit;
  hospitalize({
    petName: "Garfield", vet: "vsoto", admitted: a, discharged: a + 3,
    reason: "Obstrucción uretral. Desobstrucción y sondaje bajo sedación.",
    diagnosis: "Obstrucción uretral por tapón uretral (cristales de estruvita).",
    notes: "Alta con dieta urinaria permanente y fuente de agua.",
    logs: [
      [a, "14:00", 6.2, "37.6", 150, 28, "Sondaje uretral. Ringer lactato 15 ml/h. Analgesia.", "Orina hematúrica por sonda."],
      [a + 1, "09:00", 6.1, "38.4", 176, 26, "Fluidoterapia. Meloxicam. Control de diuresis.", "Diuresis adecuada (3 ml/kg/h)."],
      [a + 2, "09:00", 6.0, "38.6", 180, 24, "Se retira sonda. Observación de micción.", "Orina sola, chorro normal."],
      [a + 3, "10:00", 5.9, "38.5", 178, 24, "Alta médica.", "Come bien. Se entrega dieta urinaria."],
    ],
    charges: [
      [a, "Hospitalización (día)", 3, 25000],
      [a, "Sedación y sondaje uretral", 1, 45000],
      [a, "Catéter intravenoso 22G", 1],
      [a, "Suero Ringer lactato 500 ml", 3],
      [a + 1, "Meloxicam 1,5 mg/ml gotas", 1],
      [a + 1, "Jeringa 3 ml", 6],
      [a + 3, "Dieta urinaria gato 1,5 kg", 1, 21000],
    ],
    payments: [[a + 3, 120000, "debito"], [a + 3, 76000, "efectivo"]],
  });
}

// Alta: dachshund con hernia discal (manejo médico)
const tito = PETS.find((p) => p.name === "Tito");
const titoAdmit = attentionsByPet.get(tito.id).find((r) => r.key === "urgenciaHernia").offset;
{
  const a = titoAdmit;
  hospitalize({
    petName: "Tito", vet: "crojas", admitted: a, discharged: a + 4,
    reason: "Dolor toracolumbar agudo y paraparesia ambulatoria.",
    diagnosis: "Hernia discal T13-L1 (Hansen I), manejo médico conservador.",
    notes: "Reposo estricto en jaula 4 semanas. Tutor declina cirugía por ahora.",
    logs: [
      [a, "12:00", 9.1, "38.7", 110, 24, "Dexametasona IV. Tramadol c/8 h. Reposo en jaula.", "Mucho dolor a la manipulación."],
      [a + 1, "09:00", 9.1, "38.5", 104, 22, "Tramadol c/8 h. Vaciado vesical manual.", "Menos dolor. Mueve la cola."],
      [a + 2, "09:00", 9.0, "38.6", 98, 22, "Prednisolona VO. Tramadol c/12 h.", "Da algunos pasos con apoyo."],
      [a + 3, "09:00", 9.0, "38.4", 96, 20, "Prednisolona VO. Fisioterapia pasiva.", "Camina con leve ataxia. Orina solo."],
      [a + 4, "10:00", 9.0, "38.5", 96, 20, "Alta con prednisolona en dosis decreciente y tramadol 5 días.", "Alta. Reposo estricto en casa."],
    ],
    charges: [
      [a, "Hospitalización (día)", 4, 25000],
      [a, "Dexametasona inyectable", 1],
      [a, "Tramadol 50 mg (comprimido)", 10],
      [a + 2, "Prednisolona 5 mg (comprimido)", 14],
      [a + 1, "Guantes de látex (par)", 6],
    ],
    payments: [[a, 60000, "transferencia"], [a + 4, 70500, "credito"]],
  });
}

// ---------------------------------------------------------------------------
// Inventario: stock final, mínimos y pedidos a proveedores
// ---------------------------------------------------------------------------

// Productos en uso: stock final razonable, con algunos bajo el mínimo
const LOW_STOCK = new Map([
  ["Vacuna antirrábica", [2, 6]],
  ["NexGard 10-25 kg (comprimido)", [1, 4]],
  ["Catéter intravenoso 22G", [3, 10]],
  ["Meloxicam 1,5 mg/ml gotas", [1, 3]],
  ["Suero Ringer lactato 500 ml", [4, 8]],
]);
const minFor = (p) =>
  ({ vacuna: 4, antiparasitario: 3, alimento: 2, medicamento: p.sale_price < 1000 ? 20 : 3, insumo: p.sale_price < 1000 ? 20 : 4 })[p.category] ?? 2;
const updateStock = db.prepare(
  "UPDATE products SET stock = ?, min_stock = ?, tracked = 1, updated_at = ? WHERE id = ?"
);
for (const [productId, uses] of consumed) {
  const p = [...productByName.values()].find((x) => x.id === productId);
  const [stock, min] = LOW_STOCK.get(p.name) ?? (() => {
    const m = minFor(p);
    return [m + between(2, m * 3), m];
  })();
  const lastUse = Math.max(...uses.map((u) => u.offset));
  updateStock.run(stock, min, dateTime(lastUse, "19:00"), productId);
}

const insertOrder = db.prepare(
  `INSERT INTO orders (supplier, status, notes, discount, total_cost, created_at, received_at)
   VALUES (?,?,?,?,?,?,?)`
);
const insertOrderItem = db.prepare(
  "INSERT INTO order_items (order_id, product_id, quantity, unit_cost) VALUES (?,?,?,?)"
);
const insertExpense = db.prepare(
  "INSERT INTO expenses (category, description, amount, date, order_id, created_at) VALUES (?,?,?,?,?,?)"
);

function placeOrder({ supplier, status, created, received, items, discountPct = 0, notes = null }) {
  const subtotal = items.reduce((sum, [p, qty]) => sum + p.cost_price * qty, 0);
  const discount = Math.round((subtotal * discountPct) / 100);
  const totalCost = subtotal - discount;
  const orderId = insertOrder
    .run(supplier, status, notes, discount, totalCost, dateTime(created, "10:30"),
      status === "recibido" ? dateTime(received, "16:00") : null)
    .lastInsertRowid;
  for (const [p, qty] of items) insertOrderItem.run(orderId, p.id, qty, p.cost_price);
  if (status === "recibido") {
    insertExpense.run("pedido", `Pedido #${orderId} — ${supplier}`, totalCost, day(received), orderId, dateTime(received, "16:00"));
  }
}

// Un pedido recibido al mes por proveedor, según lo que se consumió ese período
const productById = new Map([...productByName.values()].map((p) => [p.id, p]));
for (let m = 0; m <= 5; m++) {
  const start = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + m, 1);
  const startOffset = Math.round((start - T) / 86400000);
  const created = openDay(startOffset + 2);
  const received = openDay(created + 3);
  if (received > -2) continue; // el mes en curso va como pedido pendiente
  const windowEnd = Math.round((new Date(start.getFullYear(), start.getMonth() + 1, 1) - T) / 86400000);
  const totals = new Map();
  for (const [productId, uses] of consumed) {
    const qty = uses.filter((u) => u.offset >= startOffset && u.offset < windowEnd).reduce((s, u) => s + u.qty, 0);
    if (qty > 0) totals.set(productId, qty);
  }
  const pack = (q) => (q >= 10 ? Math.ceil(q / 5) * 5 : q);
  const meds = [];
  const bio = [];
  for (const [productId, qty] of totals) {
    const p = productById.get(productId);
    (p.category === "vacuna" ? bio : meds).push([p, pack(qty)]);
  }
  if (meds.length) {
    placeOrder({ supplier: "Distribuidora VetSur Ltda.", status: "recibido", created, received, items: meds, discountPct: m % 2 ? 5 : 0 });
  }
  if (bio.length) {
    placeOrder({ supplier: "Biológicos del Pacífico SpA", status: "recibido", created: created + 1, received: openDay(received + 1), items: bio, notes: "Cadena de frío OK al recibir." });
  }
}
// Pedidos en curso: comprado (en camino) y pedido (por confirmar)
placeOrder({
  supplier: "Biológicos del Pacífico SpA", status: "comprado", created: openDay(-3),
  items: [[product("Vacuna antirrábica"), 15], [product("Vacuna óctuple canina"), 10], [product("Vacuna triple felina"), 8]],
  notes: "Pagado por transferencia. Despacho estimado en 2 días hábiles.",
});
placeOrder({
  supplier: "Distribuidora VetSur Ltda.", status: "pedido", created: openDay(-1),
  items: [
    [product("NexGard 10-25 kg (comprimido)"), 12], [product("Catéter intravenoso 22G"), 30],
    [product("Meloxicam 1,5 mg/ml gotas"), 8], [product("Suero Ringer lactato 500 ml"), 24],
  ],
  notes: "Reponer stock bajo. Confirmar precio del NexGard.",
});
placeOrder({
  supplier: "Insumos Clínicos Santiago", status: "pedido", created: 0,
  items: [[product("Guantes de látex (par)"), 100], [product("Gasa estéril (paquete)"), 20], [product("Jeringa 3 ml"), 50]],
});

// ---------------------------------------------------------------------------
// Gastos fijos mensuales
// ---------------------------------------------------------------------------

for (let m = 0; m <= 5; m++) {
  const y = firstMonth.getFullYear();
  const mo = firstMonth.getMonth() + m;
  const lastDay = new Date(y, mo + 1, 0).getDate();
  const add = (dom, category, description, amount) => {
    const d = new Date(y, mo, Math.min(dom, lastDay));
    const offset = Math.round((d - T) / 86400000);
    if (offset > 0) return;
    insertExpense.run(category, description, amount, iso(d), null, dateTime(offset, "09:30"));
  };
  add(5, "arriendo", "Arriendo local Av. Los Aromos", 460000);
  add(lastDay, "sueldos", "Sueldo recepción part-time (Javiera Morales)", 430000);
  // La peluquera trabaja a comisión: 40% de lo facturado en peluquería ese mes
  const monthKey = iso(new Date(y, mo, 1)).slice(0, 7);
  const grooming = db
    .prepare(
      `SELECT coalesce(sum(s.quantity * s.unit_price), 0) total FROM attention_services s
       JOIN attentions a ON a.id = s.attention_id
       WHERE s.service_id = ? AND strftime('%Y-%m', a.date) = ?`
    )
    .get(service("Peluquería / baño").id, monthKey).total;
  if (grooming) add(lastDay, "sueldos", "Comisión peluquería (40%)", Math.round((grooming * 0.4) / 100) * 100);
  add(1, "servicios_basicos", "Internet y teléfono", 34990);
  add(2, "insumos", "Artículos de aseo y desinfección", between(28000, 52000));
  add(14, "servicios_basicos", "Cuenta de luz", between(52000, 78000));
  add(18, "servicios_basicos", "Cuenta de agua", between(17000, 26000));
  add(20, "otro", "Retiro de residuos clínicos (REAS)", 32000);
  add(25, "otro", "Contador (honorarios)", 60000);
  add(between(8, 22), "insumos", pick(["Papelería e impresión de recetas", "Arena sanitaria para hospitalización", "Toallas y mantas para pacientes"]), between(12000, 24000));
  if (m === 2) add(16, "otro", "Mantención y calibración autoclave", 115000);
  if (m === 4) add(9, "insumos", "Shampoos y acondicionadores de peluquería", 64000);
}

// ---------------------------------------------------------------------------
// Agenda: citas de esta semana y la próxima + solicitudes públicas
// ---------------------------------------------------------------------------

const insertAppt = db.prepare(
  `INSERT INTO appointments (tutor_id, pet_id, tutor_name, tutor_phone, tutor_email, pet_name, species,
     date, time, reason, vet_id, duration_min, status, source, confirmed_at, attention_id, notes, created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,30,?,?,?,?,?,?)`
);
const takenSlots = new Set();
function slotsFor(vetKey, offset) {
  const out = [];
  for (const [wd, start, end] of staff[vetKey].schedule) {
    if (wd !== weekdayOf(offset)) continue;
    const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
    for (let t = toMin(start); t + 30 <= toMin(end); t += 30) {
      const hhmm = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
      if (!takenSlots.has(`${vetKey}:${offset}:${hhmm}`)) out.push(hhmm);
    }
  }
  return out;
}
function book(vetKey, offset, { pet, tutor, status, source = "interna", reason, attentionId = null, notes = null, preferAfter, preferBefore, guest }) {
  let free = slotsFor(vetKey, offset);
  if (preferAfter) free = free.filter((s) => s >= preferAfter).concat(free.filter((s) => s < preferAfter));
  if (preferBefore) free = free.filter((s) => s < preferBefore);
  if (!free.length) return false;
  const time = preferAfter || preferBefore ? free[0] : pick(free);
  takenSlots.add(`${vetKey}:${offset}:${time}`);
  const owner = tutor ?? pet?.tutorRow;
  insertAppt.run(
    owner?.id ?? null, pet?.id ?? null, guest?.name ?? owner.name, guest ? guest.phone : owner.phone,
    guest ? guest.email : owner.email, guest?.petName ?? pet.name, guest?.species ?? pet.species,
    day(offset), time, reason, staff[vetKey]?.id ?? null, status, source,
    status === "confirmada" || status === "completada" ? dateTime(Math.min(offset - 1, 0), "11:00") : null,
    attentionId, notes, dateTime(Math.min(offset, 0) - between(2, 10), "10:00")
  );
  return true;
}

// Atenciones de los últimos 7 días que vinieron con hora: citas completadas
const REASONS = {
  grooming: "Peluquería", peso: "Control de peso", otitis: "Consulta oído", desparasitacion: "Desparasitación",
  pipetaGato: "Antiparasitario", diabetes: "Control diabetes", cardio: "Control cardiológico",
  vacunaPerroRabia: "Vacunas anuales", vacunaGato: "Vacuna anual", senior: "Chequeo geriátrico",
};
for (const row of attentionRows.filter((r) => r.offset >= -6 && !r.key.startsWith("urgencia"))) {
  book(row.vetKey, row.offset, {
    pet: row.pet, status: "completada", reason: REASONS[row.key] ?? "Consulta", attentionId: row.id,
    preferBefore: row.offset === 0 ? "12:00" : undefined,
  });
}

// Controles agendados en los próximos 14 días (desde la ficha de cada mascota)
for (const pet of PETS.filter((p) => p.next && p.next[0] >= 0 && p.next[0] <= 14)) {
  let offset = pet.next[0];
  if (weekdayOf(offset) === 6) offset += 1;
  const vetKey = worksOn(pet.vet, offset) ? pet.vet : vetFor(pet, offset);
  const status = offset === 1 ? "solicitada" : offset <= 3 ? pick(["confirmada", "solicitada"]) : chance(0.6) ? "confirmada" : "solicitada";
  book(vetKey, offset, { pet, status, reason: pet.next[1], preferAfter: offset === 0 ? "11:00" : undefined });
}

// Más citas para que la agenda se vea con movimiento
const EXTRA = [
  [0, "Kiara", "confirmada", "Consulta: se rasca las orejas", "12:00"],
  [0, "Pimienta", "confirmada", "Vacuna antirrábica", "12:00"],
  [1, "Chester", "solicitada", "Control de peso y dieta"],
  [1, "Simba", "confirmada", "Revisión dental"],
  [1, "Kiara", "solicitada", "Vómitos ocasionales"],
  [2, "Canela", "confirmada", "Control post profilaxis dental"],
  [2, "Copito", "confirmada", "Corte de uñas y control"],
  [3, "Thor", "cancelada", "Baño medicado"],
  [3, "Nala", "confirmada", "Control de crecimiento"],
  [4, "Luna", "confirmada", "Chequeo antes de competencia de agility"],
  [5, "Milo", "confirmada", "Vacuna leucemia (refuerzo)"],
  [6, "Pelusa", "solicitada", "Control dental"],
  [7, "Maki", "confirmada", "Control dermatitis"],
  [8, "Bruno", "confirmada", "Retiro de puntos"],
  [9, "Oliver", "solicitada", "Fluidoterapia (consulta tutor)"],
  [10, "Max", "confirmada", "Control cardiológico"],
  [11, "Bella", "solicitada", "Limpieza de oídos"],
  [12, "Frida", "confirmada", "Peluquería y control"],
];
for (const [rawOffset, petName, status, reason, after] of EXTRA) {
  let offset = rawOffset;
  while (weekdayOf(offset) === 6) offset++;
  const pet = PETS.find((p) => p.name === petName && !p.inactive);
  const vetKey = worksOn(pet.vet, offset) ? pet.vet : vetFor(pet, offset);
  book(vetKey, offset, { pet, status, reason, preferAfter: after });
}

// Solicitudes desde la página pública /agendar (clientes nuevos, sin ficha)
const PUBLIC = [
  [1, "mcontreras", { name: "Fernanda Lagos", phone: "+56 9 6123 4870", email: null, petName: "Salem", species: "gato" }, "Mi gato no quiere comer hace 2 días"],
  [2, "crojas", { name: "Pablo Henríquez", phone: null, email: "pablo.henriquez@example.com", petName: "Mora", species: "perro" }, "Primera consulta, cachorra recién adoptada"],
  [4, "vsoto", { name: "Camila Ortúzar", phone: "+56 9 7788 1290", email: "camila.ortuzar@example.com", petName: "Nube", species: "conejo" }, "Control de conejo"],
  [6, null, { name: "Rodrigo Saavedra", phone: "+56 9 5432 1876", email: null, petName: "Firulais", species: "perro" }, "Vacunas"],
  [9, "mcontreras", { name: "Trinidad Peña", phone: "+56 9 8890 3321", email: "trinidad.pena@example.com", petName: "Cachupín", species: "perro" }, "Esterilización (consulta previa)"],
];
for (const [rawOffset, vetKey, guest, reason] of PUBLIC) {
  let offset = rawOffset;
  while (weekdayOf(offset) === 6) offset++;
  if (vetKey) {
    let o = offset;
    while (!worksOn(vetKey, o)) o++;
    book(vetKey, o, { guest, status: "solicitada", source: "publica", reason });
  } else {
    insertAppt.run(null, null, guest.name, guest.phone, guest.email, guest.petName, guest.species,
      day(offset), "10:30", reason, null, "solicitada", "publica", null, null, null, dateTime(-1, "22:14"));
  }
}

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------

const count = (table) => db.prepare(`SELECT count(*) c FROM ${table}`).get().c;
const money = (n) => `$${Math.round(n).toLocaleString("es-CL")}`;
const monthly = db
  .prepare(
    `SELECT m, sum(inc) inc, sum(exp) exp FROM (
       SELECT strftime('%Y-%m', date) m, total inc, 0 exp FROM attentions
       UNION ALL SELECT strftime('%Y-%m', date), 0, amount FROM expenses
     ) WHERE m >= ? GROUP BY m ORDER BY m`
  )
  .all(iso(firstMonth).slice(0, 7));
const receivable = db
  .prepare(
    `SELECT coalesce(sum(rem), 0) r FROM (
       SELECT total - coalesce((SELECT sum(amount) FROM payments WHERE attention_id = attentions.id), 0) rem
       FROM attentions) WHERE rem > 0`
  )
  .get().r;

console.log(`Demo lista en ${path.relative(root, dbPath)}`);
console.log(
  `  ${count("tutors")} clientes, ${count("pets")} mascotas, ${count("attentions")} atenciones, ` +
    `${count("prescriptions")} recetas, ${count("pet_health_records")} vacunas/antiparasitarios, ` +
    `${count("appointments")} citas, ${count("hospitalizations")} hospitalizaciones, ${count("orders")} pedidos, ` +
    `${count("expenses")} gastos`
);
for (const r of monthly) {
  console.log(`  ${r.m}: ingresos ${money(r.inc)} · gastos ${money(r.exp)} · resultado ${money(r.inc - r.exp)}`);
}
console.log(`  Por cobrar: ${money(receivable)}`);
console.log("  Usuarios (clave demo123): admin, crojas, mcontreras, vsoto, recepcion");

sqlite.close();
