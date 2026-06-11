"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-semibold text-gray-900">Algo salió mal</p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Ocurrió un error inesperado. Puedes intentar de nuevo.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Reintentar
      </button>
    </div>
  );
}
