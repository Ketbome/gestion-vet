import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { products, services } from "./schema";

type SeedProduct = {
  name: string;
  category: string;
  stock?: number;
  minStock?: number;
  costPrice: number;
  salePrice: number;
};

// Catálogo amplio de productos veterinarios para que el autocompletado
// funcione desde el primer arranque. Stock 0 y precios referenciales:
// el usuario ajusta stock/precios al recibir sus primeros pedidos.
// El precio de venta de las vacunas incluye la aplicación (ver servicio
// "Vacunación (vacuna del cliente)" para cuando la vacuna no es de la clínica).
const SEED_PRODUCTS: SeedProduct[] = [
  // Vacunas
  { name: "Vacuna óctuple canina", category: "vacuna", costPrice: 4500, salePrice: 12000 },
  { name: "Vacuna séxtuple canina", category: "vacuna", costPrice: 4000, salePrice: 11000 },
  { name: "Vacuna quíntuple canina", category: "vacuna", costPrice: 3800, salePrice: 10000 },
  { name: "Vacuna antirrábica", category: "vacuna", costPrice: 3000, salePrice: 8000 },
  { name: "Vacuna KC (tos de las perreras)", category: "vacuna", costPrice: 5000, salePrice: 13000 },
  { name: "Vacuna triple felina", category: "vacuna", costPrice: 4500, salePrice: 12000 },
  { name: "Vacuna leucemia felina", category: "vacuna", costPrice: 6000, salePrice: 15000 },
  { name: "Vacuna parvovirus (puppy)", category: "vacuna", costPrice: 3500, salePrice: 9000 },
  { name: "Vacuna giardia", category: "vacuna", costPrice: 5500, salePrice: 14000 },

  // Medicamentos
  { name: "Amoxicilina 500 mg (comprimido)", category: "medicamento", costPrice: 200, salePrice: 600 },
  { name: "Amoxicilina + ác. clavulánico suspensión", category: "medicamento", costPrice: 3500, salePrice: 8000 },
  { name: "Cefalexina 500 mg (comprimido)", category: "medicamento", costPrice: 250, salePrice: 700 },
  { name: "Enrofloxacino 50 mg (comprimido)", category: "medicamento", costPrice: 300, salePrice: 800 },
  { name: "Metronidazol 250 mg (comprimido)", category: "medicamento", costPrice: 150, salePrice: 500 },
  { name: "Doxiciclina 100 mg (comprimido)", category: "medicamento", costPrice: 250, salePrice: 700 },
  { name: "Meloxicam 1,5 mg/ml gotas", category: "medicamento", costPrice: 3000, salePrice: 7500 },
  { name: "Ketoprofeno 10 mg (comprimido)", category: "medicamento", costPrice: 200, salePrice: 600 },
  { name: "Tramadol 50 mg (comprimido)", category: "medicamento", costPrice: 250, salePrice: 700 },
  { name: "Prednisolona 5 mg (comprimido)", category: "medicamento", costPrice: 150, salePrice: 450 },
  { name: "Omeprazol 20 mg (cápsula)", category: "medicamento", costPrice: 150, salePrice: 500 },
  { name: "Ranitidina inyectable", category: "medicamento", costPrice: 1200, salePrice: 3500 },
  { name: "Dexametasona inyectable", category: "medicamento", costPrice: 1500, salePrice: 4000 },
  { name: "Furosemida 40 mg (comprimido)", category: "medicamento", costPrice: 200, salePrice: 600 },
  { name: "Insulina veterinaria (frasco)", category: "medicamento", costPrice: 25000, salePrice: 45000 },
  { name: "Suero fisiológico 500 ml", category: "medicamento", costPrice: 1200, salePrice: 3500 },
  { name: "Suero Ringer lactato 500 ml", category: "medicamento", costPrice: 1500, salePrice: 4000 },
  { name: "Shampoo medicado (clorhexidina)", category: "medicamento", costPrice: 5000, salePrice: 11000 },
  { name: "Gotas óticas (otitis)", category: "medicamento", costPrice: 4500, salePrice: 10000 },
  { name: "Colirio oftálmico veterinario", category: "medicamento", costPrice: 4000, salePrice: 9000 },

  // Antiparasitarios
  { name: "NexGard 4-10 kg (comprimido)", category: "antiparasitario", costPrice: 9000, salePrice: 16000 },
  { name: "NexGard 10-25 kg (comprimido)", category: "antiparasitario", costPrice: 10000, salePrice: 18000 },
  { name: "Bravecto 10-20 kg (comprimido)", category: "antiparasitario", costPrice: 22000, salePrice: 35000 },
  { name: "Bravecto 20-40 kg (comprimido)", category: "antiparasitario", costPrice: 24000, salePrice: 38000 },
  { name: "Simparica 10-20 kg (comprimido)", category: "antiparasitario", costPrice: 9000, salePrice: 16000 },
  { name: "Drontal perro (comprimido)", category: "antiparasitario", costPrice: 2500, salePrice: 6000 },
  { name: "Drontal gato (comprimido)", category: "antiparasitario", costPrice: 2800, salePrice: 6500 },
  { name: "Milbemax perro (comprimido)", category: "antiparasitario", costPrice: 4000, salePrice: 9000 },
  { name: "Pipeta Frontline Plus perro", category: "antiparasitario", costPrice: 7000, salePrice: 13000 },
  { name: "Pipeta Frontline Plus gato", category: "antiparasitario", costPrice: 6500, salePrice: 12000 },
  { name: "Pipeta Revolution gato", category: "antiparasitario", costPrice: 8000, salePrice: 14000 },
  { name: "Collar antiparasitario Seresto", category: "antiparasitario", costPrice: 28000, salePrice: 45000 },

  // Alimentos (solo dietas medicadas, lo demás es muy genérico)
  { name: "Dieta renal perro 2 kg", category: "alimento", costPrice: 14000, salePrice: 22000 },
  { name: "Dieta renal gato 1,5 kg", category: "alimento", costPrice: 13000, salePrice: 21000 },
  { name: "Dieta gastrointestinal perro 2 kg", category: "alimento", costPrice: 14000, salePrice: 22000 },

  // Insumos
  { name: "Jeringa 1 ml", category: "insumo", costPrice: 100, salePrice: 300 },
  { name: "Jeringa 3 ml", category: "insumo", costPrice: 120, salePrice: 350 },
  { name: "Jeringa 5 ml", category: "insumo", costPrice: 150, salePrice: 400 },
  { name: "Aguja hipodérmica 21G", category: "insumo", costPrice: 50, salePrice: 200 },
  { name: "Catéter intravenoso 22G", category: "insumo", costPrice: 500, salePrice: 1500 },
  { name: "Gasa estéril (paquete)", category: "insumo", costPrice: 500, salePrice: 1200 },
  { name: "Venda elástica 7,5 cm", category: "insumo", costPrice: 800, salePrice: 2000 },
  { name: "Guantes de látex (par)", category: "insumo", costPrice: 100, salePrice: 300 },
  { name: "Alcohol 70% 250 ml", category: "insumo", costPrice: 1000, salePrice: 2500 },
  { name: "Povidona yodada 250 ml", category: "insumo", costPrice: 2000, salePrice: 4500 },
  { name: "Sutura nylon 3-0", category: "insumo", costPrice: 1500, salePrice: 4000 },
  { name: "Hoja de bisturí N°15", category: "insumo", costPrice: 200, salePrice: 600 },
  { name: "Collar isabelino N°15", category: "insumo", costPrice: 2000, salePrice: 5000 },
  { name: "Bozal nylon mediano", category: "insumo", costPrice: 2500, salePrice: 6000 },
];

const SEED_SERVICES = [
  { name: "Consulta general", price: 15000, description: "Consulta médica general" },
  { name: "Control", price: 8000, description: "Control de seguimiento" },
  { name: "Vacunación (vacuna del cliente)", price: 8000, description: "Solo aplicación, cuando el cliente trae su vacuna. Si la vacuna es de la clínica, agrega solo el producto: su precio ya incluye la aplicación." },
  { name: "Desparasitación", price: 10000, description: "Aplicación de antiparasitario" },
  { name: "Peluquería / baño", price: 15000, description: "Baño y corte de pelo" },
  { name: "Cirugía menor", price: 50000, description: "Procedimiento quirúrgico menor" },
  { name: "Esterilización", price: 60000, description: "Esterilización / castración" },
  { name: "Eutanasia", price: 40000, description: "Eutanasia humanitaria" },
  { name: "Atención de urgencia", price: 25000, description: "Consulta de urgencia" },
];

export function seed<TSchema extends Record<string, unknown>>(
  db: BetterSQLite3Database<TSchema>
) {
  db.insert(services).values(SEED_SERVICES).run();
  db.insert(products)
    .values(
      SEED_PRODUCTS.map((p) => ({
        name: p.name,
        category: p.category,
        stock: p.stock ?? 0,
        minStock: p.minStock ?? 0,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
      }))
    )
    .run();
}
