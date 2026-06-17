import Link from "next/link";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function Calendar({
  year,
  month,
  selectedDay,
  today,
  counts,
}: {
  year: number;
  month: number; // 0-based
  selectedDay: string;
  today: string;
  counts: Record<string, number>;
}) {
  const firstDay = new Date(year, month, 1);
  // 0 = lunes … 6 = domingo
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = month === 0 ? iso(year - 1, 11, 1) : iso(year, month - 1, 1);
  const next = month === 11 ? iso(year + 1, 0, 1) : iso(year, month + 1, 1);

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/agenda?mes=${prev.slice(0, 7)}`}
          className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          aria-label="Mes anterior"
        >
          ←
        </Link>
        <span className="font-semibold text-gray-900">
          {MONTHS[month]} {year}
        </span>
        <Link
          href={`/agenda?mes=${next.slice(0, 7)}`}
          className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          aria-label="Mes siguiente"
        >
          →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />;
          const day = iso(year, month, d);
          const count = counts[day] ?? 0;
          const isSelected = day === selectedDay;
          const isToday = day === today;
          return (
            <Link
              key={day}
              href={`/agenda?mes=${day.slice(0, 7)}&dia=${day}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${
                isSelected
                  ? "bg-primary-600 text-white"
                  : isToday
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{d}</span>
              {count > 0 && (
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-primary-500"
                  }`}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
