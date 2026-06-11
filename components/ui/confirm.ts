import Swal from "sweetalert2";

// Confirmaciones con el mismo lenguaje visual de la app
// (cards blancas rounded-xl, primario teal, peligro rojo)
export async function confirmDialog({
  title = "¿Estás seguro?",
  text,
  confirmText = "Sí, eliminar",
  danger = true,
}: {
  title?: string;
  text?: string;
  confirmText?: string;
  danger?: boolean;
}): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    iconColor: danger ? "#ef4444" : "#f59e0b",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: "rounded-2xl shadow-xl",
      title: "text-lg font-bold text-gray-900",
      htmlContainer: "text-sm text-gray-500",
      actions: "gap-2",
      confirmButton: danger
        ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-300 focus:outline-none"
        : "rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:ring-2 focus:ring-primary-300 focus:outline-none",
      cancelButton:
        "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:outline-none",
    },
  });
  return result.isConfirmed;
}
