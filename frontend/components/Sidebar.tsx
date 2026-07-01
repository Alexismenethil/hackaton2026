"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, TriangleAlert, Settings } from "lucide-react";

// Alertas y Configuración quedan fuera del alcance de esta demo (no tienen
// página propia): se muestran atenuadas y no navegables en vez de apuntar a
// una ruta que no existe.
const ITEMS_ACTIVOS = [
  { href: "/", label: "Resumen", icon: LayoutGrid, activo: (p: string) => p === "/" },
  { href: "/", label: "Estudiantes", icon: Users, activo: (p: string) => p.startsWith("/estudiantes") },
];

const ITEMS_DESHABILITADOS = [
  { label: "Alertas", icon: TriangleAlert },
  { label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-black/5 bg-cream px-4 py-6">
      <div>
        <div className="px-2 pb-8">
          <h1 className="text-lg font-bold text-ink">Radar Escolar</h1>
          <p className="text-xs text-ink-light">Pedagogía del Cuidado</p>
        </div>

        <nav className="flex flex-col gap-1">
          {ITEMS_ACTIVOS.map(({ href, label, icon: Icon, activo }) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                activo(pathname) ? "bg-accent-light text-ink" : "text-ink-light hover:bg-black/5"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          {ITEMS_DESHABILITADOS.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-light/40"
            >
              <Icon size={18} />
              {label}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
          PM
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Prof. Mendoza</p>
          <p className="text-xs text-ink-light">I.E. Los Andes</p>
        </div>
      </div>
    </aside>
  );
}
