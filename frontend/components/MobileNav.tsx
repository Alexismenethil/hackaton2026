"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navItems";

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-black/5 bg-paper/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, activo }) => {
        const active = activo(pathname);
        return (
          <Link
            key={label}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-transform duration-150 active:scale-90"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
                active ? "bg-accent-light text-ink" : "text-ink-light"
              }`}
            >
              <Icon size={18} />
            </span>
            <span className={`transition-colors duration-200 ${active ? "font-semibold text-ink" : "text-ink-light"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
