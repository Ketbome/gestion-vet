import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { getCurrencyConfig } from "@/lib/currency";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "GestionVet",
  title: {
    default: "GestionVet",
    template: "%s · GestionVet",
  },
  description: "Gestión de veterinaria: inventario, atenciones, pedidos y finanzas",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GestionVet",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Se resuelve en el servidor en runtime y se inyecta al cliente:
  // el mismo build sirve para cualquier moneda (CURRENCY_LOCALE/CURRENCY).
  const currency = getCurrencyConfig();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__CURRENCY__=${JSON.stringify(currency)}`,
          }}
        />
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
