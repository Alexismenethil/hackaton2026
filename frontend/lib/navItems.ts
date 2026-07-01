import { LayoutGrid, Users, TriangleAlert, Settings, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  activo: (pathname: string) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Resumen", icon: LayoutGrid, activo: (p) => p === "/" },
  { href: "/", label: "Estudiantes", icon: Users, activo: (p) => p.startsWith("/estudiantes") },
  { href: "/alertas", label: "Alertas", icon: TriangleAlert, activo: (p) => p.startsWith("/alertas") },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings,
    activo: (p) => p.startsWith("/configuracion"),
  },
];
