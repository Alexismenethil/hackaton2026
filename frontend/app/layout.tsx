import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Radar Escolar",
  description: "Pedagogía del Cuidado — detección temprana de estudiantes en riesgo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className="overflow-x-hidden">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileHeader />
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
          </div>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
