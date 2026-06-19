import { and, asc, eq, isNotNull, lt, sql } from "drizzle-orm";
import { db, pets, tutors, attentions, petHealthRecords } from "@/lib/db";
import { addDays, today } from "@/lib/dates";

export type UpcomingVisit = {
  petId: number;
  petName: string;
  tutorName: string;
  tutorPhone: string | null;
  date: string;
  note: string | null;
};

export function getUpcomingVisits(): UpcomingVisit[] {
  return db
    .select({
      petId: pets.id,
      petName: pets.name,
      tutorName: tutors.name,
      tutorPhone: tutors.phone,
      date: sql<string>`${pets.nextVisitDate}`,
      note: pets.nextVisitNote,
    })
    .from(pets)
    .innerJoin(tutors, eq(pets.tutorId, tutors.id))
    .where(and(eq(pets.active, true), isNotNull(pets.nextVisitDate)))
    .orderBy(asc(pets.nextVisitDate))
    .all();
}

export type InactivePet = {
  petId: number;
  petName: string;
  tutorName: string;
  tutorPhone: string | null;
  lastVisit: string;
};

// Mascotas activas cuya última atención fue hace más de `months` meses.
export function getInactivePets(months = 12): InactivePet[] {
  const cutoff = addDays(today(), -Math.round(months * 30.4));
  return db.all<InactivePet>(sql`
    select p.id as petId, p.name as petName, t.name as tutorName,
           t.phone as tutorPhone, max(a.date) as lastVisit
    from ${pets} p
    join ${tutors} t on t.id = p.tutor_id
    join ${attentions} a on a.pet_id = p.id
    where p.active = 1
    group by p.id
    having lastVisit < ${cutoff}
       and coalesce(p.next_visit_date, '') < ${today()}
    order by lastVisit asc
  `);
}

export type DueRecord = {
  id: number;
  name: string;
  type: string;
  nextDueDate: string;
  petId: number;
  petName: string;
  tutorName: string;
};

export function getDueHealthRecords(days = 30): DueRecord[] {
  return db
    .select({
      id: petHealthRecords.id,
      name: petHealthRecords.name,
      type: petHealthRecords.type,
      nextDueDate: sql<string>`${petHealthRecords.nextDueDate}`,
      petId: pets.id,
      petName: pets.name,
      tutorName: tutors.name,
    })
    .from(petHealthRecords)
    .innerJoin(pets, eq(petHealthRecords.petId, pets.id))
    .innerJoin(tutors, eq(pets.tutorId, tutors.id))
    .where(
      and(
        eq(pets.active, true),
        lt(petHealthRecords.nextDueDate, addDays(today(), days))
      )
    )
    .orderBy(asc(petHealthRecords.nextDueDate))
    .all();
}
