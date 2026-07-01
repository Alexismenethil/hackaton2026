import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProfileCard from "@/components/detail/ProfileCard";
import EvolutionChart from "@/components/detail/EvolutionChart";
import SignalsList from "@/components/detail/SignalsList";
import AIRecommendationCard from "@/components/detail/AIRecommendationCard";
import ObservationLog from "@/components/detail/ObservationLog";
import ContextSupportCard from "@/components/detail/ContextSupportCard";
import { obtenerEstudiante, type SemanaSeguimiento } from "@/lib/api";

function promedio(valores: number[]) {
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((total, valor) => total + valor, 0) / valores.length) * 10) / 10;
}

function calcularMetricasRecientes(historial: SemanaSeguimiento[]) {
  const ultimas4 = historial.slice(-4);
  return {
    asistencia_ultimas_4_semanas: promedio(ultimas4.map((h) => Number(h.asistencia_pct))),
    promedio_notas: promedio(ultimas4.map((h) => Number(h.promedio_notas))),
    comprension_lectora: promedio(ultimas4.map((h) => Number(h.comprension_lectora)).filter(Number.isFinite)),
    participacion: promedio(ultimas4.map((h) => Number(h.participacion_score))),
    tareas_entregadas: promedio(ultimas4.map((h) => Number(h.tareas_entregadas_pct)).filter(Number.isFinite)),
  };
}

export default async function EstudianteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let detalle;
  try {
    detalle = await obtenerEstudiante(id);
  } catch {
    return (
      <div className="px-10 py-8">
        <p className="text-danger">No se pudo cargar la información del estudiante.</p>
      </div>
    );
  }

  const { estudiante, historial, riesgo } = detalle;
  const metricasRecientes = detalle.metricasRecientes ?? calcularMetricasRecientes(historial);

  return (
    <div className="pb-10">
      <div className="flex items-center gap-4 px-10 py-8">
        <Link href="/" className="text-ink-light hover:text-ink">
          <ArrowLeft size={22} />
        </Link>
        <h2 className="text-2xl font-bold text-ink">Radar Escolar</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 px-10 lg:grid-cols-[320px_1fr]">
        <ProfileCard estudiante={estudiante} riesgo={riesgo} />
        <EvolutionChart historial={historial} />
      </div>

      <div className="grid grid-cols-1 gap-5 px-10 pt-5 lg:grid-cols-2">
        <SignalsList senales={riesgo.senales} />
        <AIRecommendationCard estudianteId={estudiante.id} />
      </div>

      <div className="grid grid-cols-1 gap-5 px-10 pt-5 lg:grid-cols-[1fr_420px]">
        <ContextSupportCard estudiante={estudiante} metricas={metricasRecientes} />
        <ObservationLog estudianteId={estudiante.id} />
      </div>
    </div>
  );
}
