"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navItems";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-black/5 bg-cream px-4 py-6 md:flex">
      <div>
        <div className="px-2 pb-8">
          <h1 className="text-lg font-bold text-ink">Radar Escolar</h1>
          <p className="text-xs text-ink-light">Pedagogía del Cuidado</p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, activo }) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                activo(pathname)
                  ? "bg-accent-light text-ink shadow-sm"
                  : "text-ink-light hover:translate-x-0.5 hover:bg-black/5"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
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
