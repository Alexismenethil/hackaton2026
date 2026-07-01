import Link from "next/link";
import Avatar from "./Avatar";
import RiskBadge from "./RiskBadge";
import type { EstudianteResumen } from "@/lib/api";

export default function AlertRow({ estudiante }: { estudiante: EstudianteResumen }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-paper p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:flex-row md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-3 md:flex-1">
        <Avatar nombre={estudiante.nombre_ficticio} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{estudiante.nombre_ficticio}</p>
          <p className="truncate text-xs text-ink-light">
            {estudiante.grado} - Sección {estudiante.seccion}
          </p>
        </div>
      </div>

      <p className="hidden truncate text-sm italic text-ink-light md:block md:max-w-xs md:flex-1">
        {estudiante.senalPrincipal}
      </p>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <RiskBadge nivel={estudiante.nivelRiesgo} />
        <Link
          href={`/estudiantes/${estudiante.id}`}
          className="shrink-0 rounded-xl bg-ink px-4 py-2 text-center text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          Ver detalle
        </Link>
      </div>
    </div>
  );
}
