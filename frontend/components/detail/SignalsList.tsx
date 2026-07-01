import { TrendingDown, CheckCircle2 } from "lucide-react";
import type { Senal } from "@/lib/api";

export default function SignalsList({ senales }: { senales: Senal[] }) {
  return (
    <div className="rounded-2xl bg-cream p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">Señales detectadas</h3>

      {senales.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl bg-paper p-4">
          <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={20} />
          <p className="text-sm text-ink">
            No hay señales activas: las métricas de seguimiento se han mantenido estables en las últimas semanas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {senales.map((senal) => (
            <div key={senal.tipo} className="flex items-start gap-3 rounded-xl bg-paper p-4">
              <TrendingDown className="mt-0.5 shrink-0 text-danger" size={20} />
              <p className="text-sm text-ink">
                {senal.resumen}{" "}
                <span className="font-semibold text-ink-light">[Semana {senal.semana}]</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
