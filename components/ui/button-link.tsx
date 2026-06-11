import Link from "next/link";

const STYLES = {
  primary:
    "bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus:ring-2 focus:ring-primary-300",
  secondary:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof STYLES;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none ${STYLES[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
