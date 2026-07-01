import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProfileCard from "@/components/detail/ProfileCard";
import EvolutionChart from "@/components/detail/EvolutionChart";
import SignalsList from "@/components/detail/SignalsList";
import AIRecommendationCard from "@/components/detail/AIRecommendationCard";
import ObservationLog from "@/components/detail/ObservationLog";
import ContextSupportCard from "@/components/detail/ContextSupportCard";
import { obtenerEstudiante } from "@/lib/api";

export default async function EstudianteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let detalle;
  try {
    detalle = await obtenerEstudiante(id);
  } catch {
    return (
      <div className="px-4 py-8 sm:px-6 md:px-10">
        <p className="text-danger">No se pudo cargar la información del estudiante.</p>
      </div>
    );
  }

  const { estudiante, historial, riesgo, metricasRecientes } = detalle;

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="flex items-center gap-3 px-4 py-6 sm:px-6 md:px-10 md:py-8">
        <Link
          href="/"
          aria-label="Volver"
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-ink-light transition-colors duration-150 hover:bg-black/5 hover:text-ink active:scale-95"
        >
          <ArrowLeft size={22} />
        </Link>
        <h2 className="hidden text-2xl font-bold text-ink md:block">Radar Escolar</h2>
        <h2 className="text-lg font-bold text-ink md:hidden">Detalle del estudiante</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 px-4 sm:px-6 md:px-10 lg:grid-cols-[320px_1fr]">
        <ProfileCard estudiante={estudiante} riesgo={riesgo} />
        <EvolutionChart historial={historial} />
      </div>

      <div className="grid grid-cols-1 gap-5 px-4 pt-5 sm:px-6 md:px-10 lg:grid-cols-2">
        <SignalsList senales={riesgo.senales} />
        <AIRecommendationCard estudianteId={estudiante.id} />
      </div>

      <div className="grid grid-cols-1 gap-5 px-4 pt-5 sm:px-6 md:px-10 lg:grid-cols-[1fr_420px]">
        <ContextSupportCard estudiante={estudiante} metricas={metricasRecientes} />
        <ObservationLog estudianteId={estudiante.id} />
      </div>
    </div>
  );
}
