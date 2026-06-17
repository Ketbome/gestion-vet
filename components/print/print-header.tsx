import { getSettings } from "@/lib/settings";

export function PrintHeader({ title }: { title: string }) {
  const s = getSettings();
  const contact = [s.clinicPhone, s.clinicEmail, s.clinicAddress]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="mb-6 flex items-center justify-between gap-4 border-b border-gray-300 pb-4">
      <div className="flex items-center gap-4">
        {s.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logo} alt="" className="h-16 w-16 object-contain" />
        )}
        <div>
          <p className="text-lg font-bold text-gray-900">
            {s.clinicName || "Veterinaria"}
          </p>
          {s.clinicRut && <p className="text-xs text-gray-500">RUT {s.clinicRut}</p>}
          {contact && <p className="text-xs text-gray-500">{contact}</p>}
        </div>
      </div>
      <h1 className="text-right text-xl font-bold tracking-tight text-gray-900">
        {title}
      </h1>
    </header>
  );
}
