import Avatar from "@/components/Avatar";
import type { Estudiante, Riesgo } from "@/lib/api";

const ETIQUETA_POR_TIPO: Record<string, string> = {
  asistencia: "Alerta de Asistencia",
  notas: "Alerta de Notas",
  comprension: "Alerta de Comprensión",
  participacion: "Alerta de Participación",
  tareas: "Alerta de Tareas",
};

const CLASIFICACION: Record<string, string> = {
  no_pobre: "No pobre",
  pobre: "Pobre",
  pobre_extremo: "Pobre extremo",
};

export default function ProfileCard({ estudiante, riesgo }: { estudiante: Estudiante; riesgo: Riesgo }) {
  const etiquetas =
    riesgo.senales.length > 0
      ? riesgo.senales.map((s) => ETIQUETA_POR_TIPO[s.tipo])
      : ["Rendimiento Estable"];

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-paper p-6 text-center shadow-sm">
      <Avatar nombre={estudiante.nombre_ficticio} size={72} />
      <div>
        <h2 className="text-xl font-bold text-ink">{estudiante.nombre_ficticio}</h2>
        <p className="text-sm uppercase tracking-wide text-ink-light">
          {estudiante.grado} · Sección {estudiante.seccion}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {etiquetas.map((etiqueta) => (
          <span
            key={etiqueta}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              etiqueta === "Rendimiento Estable" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
            }`}
          >
            {etiqueta}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 border-t border-black/5 pt-4">
        <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-light">
          {CLASIFICACION[estudiante.clasificacion_socioeconomica] || "Sin CSE"}
        </span>
        {!estudiante.internet_en_casa && (
          <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-light">Sin internet</span>
        )}
        {estudiante.estudiante_trabaja && (
          <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-light">Trabaja</span>
        )}
        {estudiante.es_foraneo && (
          <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-light">Foráneo</span>
        )}
      </div>
    </div>
  );
}
