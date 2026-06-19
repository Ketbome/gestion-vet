import { sql } from "drizzle-orm";
import { db, users, vetSchedules } from "@/lib/db";

export type VetOption = { id: number; name: string; color: string };

// Veterinarios seleccionables: todos los con rol "veterinario", más los admin
// que hayan configurado al menos un bloque de horario (admin que también atiende).
export function getSchedulableVets(): VetOption[] {
  return db.all<VetOption>(sql`
    select ${users.id} as id, ${users.name} as name, ${users.color} as color
    from ${users}
    where ${users.active} = 1
      and (
        ${users.role} = 'veterinario'
        or (
          ${users.role} = 'admin'
          and exists (
            select 1 from ${vetSchedules}
            where ${vetSchedules.userId} = ${users.id}
          )
        )
      )
    order by ${users.name}
  `);
}
