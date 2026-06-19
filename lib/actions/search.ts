"use server";

import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { db, tutors, pets, attentions } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { getClinicMode } from "@/lib/settings";
import { SPECIES_LABELS, type Species } from "@/lib/constants";

export type SearchResult = {
  key: string;
  group: string;
  label: string;
  sublabel?: string;
  href: string;
};

export async function searchEntities(rawQ: string): Promise<SearchResult[]> {
  if (!(await verifySession())) return [];

  const q = rawQ.trim();
  if (q.length < 2) return [];
  const pattern = `%${q.toLowerCase()}%`;

  if (getClinicMode() !== "completo") {
    const list = db
      .select({ id: attentions.id, petName: attentions.petName, ownerName: attentions.ownerName, date: attentions.date })
      .from(attentions)
      .where(
        or(
          like(sql`lower(${attentions.petName})`, pattern),
          like(sql`lower(${attentions.ownerName})`, pattern)
        )
      )
      .orderBy(desc(attentions.date), desc(attentions.id))
      .limit(8)
      .all();
    return list.map((a) => ({
      key: `a-${a.id}`,
      group: "Atenciones",
      label: a.petName,
      sublabel: a.ownerName,
      href: `/atenciones/${a.id}`,
    }));
  }

  const clientes = db
    .select({ id: tutors.id, name: tutors.name, phone: tutors.phone, rut: tutors.rut })
    .from(tutors)
    .where(
      and(
        eq(tutors.active, true),
        or(
          like(sql`lower(${tutors.name})`, pattern),
          like(sql`lower(${tutors.phone})`, pattern),
          like(sql`lower(${tutors.email})`, pattern),
          like(sql`lower(${tutors.rut})`, pattern)
        )
      )
    )
    .orderBy(asc(tutors.name))
    .limit(6)
    .all();

  const mascotas = db
    .select({
      id: pets.id,
      name: pets.name,
      species: pets.species,
      tutorName: tutors.name,
    })
    .from(pets)
    .leftJoin(tutors, eq(pets.tutorId, tutors.id))
    .where(
      and(
        eq(pets.active, true),
        or(
          like(sql`lower(${pets.name})`, pattern),
          like(sql`lower(${pets.microchip})`, pattern)
        )
      )
    )
    .orderBy(asc(pets.name))
    .limit(6)
    .all();

  return [
    ...clientes.map((c) => ({
      key: `c-${c.id}`,
      group: "Clientes",
      label: c.name,
      sublabel: [c.rut, c.phone].filter(Boolean).join(" · ") || undefined,
      href: `/clientes/${c.id}`,
    })),
    ...mascotas.map((m) => ({
      key: `p-${m.id}`,
      group: "Mascotas",
      label: m.name,
      sublabel: [SPECIES_LABELS[m.species as Species] ?? m.species, m.tutorName]
        .filter(Boolean)
        .join(" · "),
      href: `/mascotas/${m.id}`,
    })),
  ];
}
