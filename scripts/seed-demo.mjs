// Datos de demostración para el modo completo.
// Uso: node scripts/seed-demo.mjs
import Database from "better-sqlite3";
import { randomBytes, scryptSync } from "node:crypto";

const dbPath = process.env.DATABASE_PATH ?? "./data/gestionvet.db";
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

function iso(d) {
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
}

// Activar modo completo + agenda pública
db.prepare(
  `INSERT INTO settings (id, clinic_mode, clinic_name, public_booking_enabled)
   VALUES (1, 'completo', 'Veterinaria Patitas', 1)
   ON CONFLICT(id) DO UPDATE SET
     clinic_mode='completo', clinic_name='Veterinaria Patitas',
     public_booking_enabled=1, updated_at=datetime('now')`
).run();

// Veterinario demo con horario semanal (idempotente)
const vetCount = db
  .prepare("SELECT count(*) c FROM users WHERE role = 'veterinario'")
  .get().c;
if (vetCount === 0) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync("vet123", salt, 64).toString("hex");
  const vetId = db
    .prepare(
      `INSERT INTO users (username, name, role, password_hash, password_salt, color)
       VALUES (?,?,?,?,?,?)`
    )
    .run("drarojas", "Dra. Camila Rojas", "veterinario", hash, salt, "#16a34a")
    .lastInsertRowid;

  const addBlock = db.prepare(
    "INSERT INTO vet_schedules (user_id, weekday, start_time, end_time) VALUES (?,?,?,?)"
  );
  for (let weekday = 0; weekday <= 4; weekday++) {
    addBlock.run(vetId, weekday, "09:00", "13:00");
    addBlock.run(vetId, weekday, "15:00", "18:00");
  }

  // Asignar el vet a citas/atenciones existentes sin vet
  db.prepare("UPDATE appointments SET vet_id = ? WHERE vet_id IS NULL").run(vetId);
  db.prepare("UPDATE attentions SET vet_id = ? WHERE vet_id IS NULL").run(vetId);
  console.log("Veterinario demo creado: usuario 'drarojas' / clave 'vet123'.");
}

const tutorCount = db.prepare("SELECT count(*) c FROM tutors").get().c;
if (tutorCount > 0) {
  console.log(
    `Ya existen ${tutorCount} clientes; no se insertan duplicados. Modo completo activado.`
  );
  process.exit(0);
}

const serviceId = (name) =>
  db.prepare("SELECT id FROM services WHERE name = ?").get(name)?.id;
const consulta = serviceId("Consulta general");
const control = serviceId("Control");

const insertTutor = db.prepare(
  "INSERT INTO tutors (name, phone, email, rut, address) VALUES (?,?,?,?,?)"
);
const insertPet = db.prepare(
  `INSERT INTO pets (tutor_id, name, species, breed, sex, birth_date, weight_grams, microchip, sterilized)
   VALUES (?,?,?,?,?,?,?,?,?)`
);
const insertHealth = db.prepare(
  `INSERT INTO pet_health_records (pet_id, type, name, applied_date, next_due_date)
   VALUES (?,?,?,?,?)`
);
const insertAttention = db.prepare(
  `INSERT INTO attentions (pet_name, owner_name, tutor_id, pet_id, weight_grams, temperature, date, notes, total)
   VALUES (?,?,?,?,?,?,?,?,?)`
);
const insertAttService = db.prepare(
  "INSERT INTO attention_services (attention_id, service_id, quantity, unit_price) VALUES (?,?,?,?)"
);
const insertAppt = db.prepare(
  `INSERT INTO appointments (tutor_id, pet_id, tutor_name, tutor_phone, tutor_email, pet_name, species, date, time, reason, status, source, confirmed_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
);

const tx = db.transaction(() => {
  // Tutores
  const maria = insertTutor.run("María Pérez", "+56 9 8765 4321", "maria@example.com", "12.345.678-9", "Av. Siempre Viva 123").lastInsertRowid;
  const juan = insertTutor.run("Juan Soto", "+56 9 1234 5678", "juan@example.com", null, null).lastInsertRowid;
  const camila = insertTutor.run("Camila Rojas", "+56 9 5555 1234", null, null, null).lastInsertRowid;

  // Mascotas
  const firulais = insertPet.run(maria, "Firulais", "perro", "Labrador", "macho", "2021-03-10", 30000, "982000123456789", 1).lastInsertRowid;
  const michi = insertPet.run(maria, "Michi", "gato", "Siamés", "hembra", "2022-07-01", 4200, null, 1).lastInsertRowid;
  const rocky = insertPet.run(juan, "Rocky", "perro", "Bulldog francés", "macho", "2019-11-20", 13000, null, 0).lastInsertRowid;
  insertPet.run(camila, "Luna", "perro", "Mestizo", "hembra", "2023-01-05", 12000, null, 0);

  // Vacunas / antiparasitarios con próximas fechas (para el panel del dashboard)
  insertHealth.run(firulais, "vacuna", "Vacuna óctuple canina", daysFromNow(-360), daysFromNow(5));
  insertHealth.run(firulais, "antiparasitario", "NexGard", daysFromNow(-20), daysFromNow(10));
  insertHealth.run(michi, "vacuna", "Vacuna triple felina", daysFromNow(-355), daysFromNow(10));
  insertHealth.run(rocky, "vacuna", "Vacuna antirrábica", daysFromNow(-380), daysFromNow(-5)); // vencida

  // Atenciones de Firulais (historial + evolución de peso)
  const a1 = insertAttention.run("Firulais", "María Pérez", maria, firulais, 28000, "38.4", daysFromNow(-90), "Control de rutina, todo normal.", 8000).lastInsertRowid;
  if (control) insertAttService.run(a1, control, 1, 8000);
  const a2 = insertAttention.run("Firulais", "María Pérez", maria, firulais, 30000, "38.6", daysFromNow(-10), "Consulta por chequeo anual.", 15000).lastInsertRowid;
  if (consulta) insertAttService.run(a2, consulta, 1, 15000);

  // Citas
  // Mañana sin confirmar -> aparece en "Confirmaciones de mañana"
  insertAppt.run(maria, firulais, "María Pérez", "+56 9 8765 4321", "maria@example.com", "Firulais", "perro", daysFromNow(1), "10:30", "Control", "solicitada", "interna", null);
  // Hoy confirmada
  insertAppt.run(juan, rocky, "Juan Soto", "+56 9 1234 5678", "juan@example.com", "Rocky", "perro", daysFromNow(0), "16:00", "Vacuna antirrábica", "confirmada", "interna", new Date().toISOString().slice(0, 19).replace("T", " "));
  // Solicitud pública sin ficha previa
  insertAppt.run(null, null, "Pedro Díaz", "+56 9 4444 7777", null, "Toby", "perro", daysFromNow(5), "11:00", "Primera consulta", "solicitada", "publica", null);
});

tx();

console.log("Datos demo cargados: 3 clientes, 4 mascotas, 4 registros de salud, 2 atenciones, 3 citas. Modo completo activado.");
