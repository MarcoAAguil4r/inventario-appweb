import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventario - Gestión de Inventario",
  description: "Sistema para gestionar productos, stock, productos dañados, mermas y alertas de bajo inventario.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="scroll-smooth"
    >
      <body className="min-h-screen flex flex-col bg-white">{children}</body>
    </html>
  );
}
