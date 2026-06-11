export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="GestionVet"
    >
      <rect width="48" height="48" rx="12" fill="var(--color-primary-600)" />
      {/* Dedos de la huella */}
      <circle cx="15" cy="15.5" r="4.2" fill="white" />
      <circle cx="24" cy="12" r="4.2" fill="white" />
      <circle cx="33" cy="15.5" r="4.2" fill="white" />
      <circle cx="9.5" cy="24.5" r="3.6" fill="white" />
      <circle cx="38.5" cy="24.5" r="3.6" fill="white" />
      {/* Almohadilla principal */}
      <path
        d="M24 22c6.6 0 12 5 12 10.6 0 3.5-2.6 5.9-6 5.9-2.3 0-4.4-1-6-1s-3.7 1-6 1c-3.4 0-6-2.4-6-5.9C12 27 17.4 22 24 22Z"
        fill="white"
      />
      {/* Cruz médica sobre la almohadilla */}
      <path
        d="M22.4 26.5h3.2v3.1h3.1v3.2h-3.1v3.1h-3.2v-3.1h-3.1v-3.2h3.1v-3.1Z"
        fill="var(--color-primary-600)"
      />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="text-xl font-bold tracking-tight text-gray-900">
          Gestion<span className="text-primary-600">Vet</span>
        </span>
      )}
    </span>
  );
}
