import Link from "next/link";
import Avatar from "./Avatar";
import RiskBadge from "./RiskBadge";
import Sparkline from "./Sparkline";
import type { EstudianteResumen } from "@/lib/api";

const COLOR_POR_NIVEL = { Bajo: "#3F7F5C", Medio: "#B9791F", Alto: "#C0463F" };

export default function StudentCard({ estudiante }: { estudiante: EstudianteResumen }) {
  const contextoResumen = estudiante.contextoResumen ?? [];
  const metricasRecientes = estudiante.metricasRecientes ?? {};

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-paper p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <Avatar nombre={estudiante.nombre_ficticio} />
        <RiskBadge nivel={estudiante.nivelRiesgo} />
      </div>

      <div>
        <h3 className="font-bold text-ink">{estudiante.nombre_ficticio}</h3>
        <p className="text-sm text-ink-light">
          {estudiante.grado} - Sección {estudiante.seccion}
        </p>
      </div>

      {contextoResumen.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contextoResumen.slice(0, 3).map((etiqueta) => (
            <span key={etiqueta} className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-ink-light">
              {etiqueta}
            </span>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-light/70">Señal principal</p>
        <p className="text-sm italic text-ink">{estudiante.senalPrincipal}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-ink-light">
        <span>Lectura: {metricasRecientes.comprension_lectora ?? "s/d"}</span>
        <span>Tareas: {metricasRecientes.tareas_entregadas ?? "s/d"}%</span>
      </div>

      <Sparkline valores={estudiante.tendenciaAsistencia} color={COLOR_POR_NIVEL[estudiante.nivelRiesgo]} />

      <Link
        href={`/estudiantes/${estudiante.id}`}
        className="rounded-xl bg-ink py-2.5 text-center text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        Ver detalle
      </Link>
    </div>
  );
}
