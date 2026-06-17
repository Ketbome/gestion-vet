"use server";

import { freeSlots } from "@/lib/availability";

export async function getFreeSlots(
  vetId: number,
  date: string
): Promise<string[]> {
  return freeSlots(vetId, date);
}
