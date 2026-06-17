export type DateRange = {
  rango: string;
  start: string; // YYYY-MM-DD inclusive
  end: string; // YYYY-MM-DD inclusive
};

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function rangeFromSearchParams(params: {
  rango?: string;
  desde?: string;
  hasta?: string;
}): DateRange {
  const now = new Date();
  const rango = params.rango ?? "mes";

  switch (rango) {
    case "hoy":
      return { rango, start: toISODate(now), end: toISODate(now) };
    case "semana": {
      // Semana partiendo el lunes
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      return { rango, start: toISODate(monday), end: toISODate(now) };
    }
    case "ano": {
      const first = new Date(now.getFullYear(), 0, 1);
      return { rango, start: toISODate(first), end: toISODate(now) };
    }
    case "custom": {
      const desde = params.desde || toISODate(now);
      const hasta = params.hasta || toISODate(now);
      return { rango, start: desde, end: hasta };
    }
    case "mes":
    default: {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { rango: "mes", start: toISODate(first), end: toISODate(now) };
    }
  }
}

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(isoDate: string): string {
  // isoDate viene como YYYY-MM-DD; parsear como fecha local, no UTC
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return dateFormatter.format(new Date(y, m - 1, d));
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function ageLabel(birthDate: string): string {
  const [y, m, d] = birthDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  const now = new Date();
  let months =
    (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (now.getDate() < d) months -= 1;
  if (months < 0) return "";
  if (months < 12) return `${months} mes${months === 1 ? "" : "es"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest
    ? `${years} año${years === 1 ? "" : "s"} ${rest} mes${rest === 1 ? "" : "es"}`
    : `${years} año${years === 1 ? "" : "s"}`;
}
