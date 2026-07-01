"use client";

import { useEffect, useState } from "react";
import { Sparkles, CalendarPlus } from "lucide-react";
import { generarRecomendacion, type Recomendacion } from "@/lib/api";

const ETIQUETA_FUENTE: Record<Recomendacion["fuente"], string> = {
  gemini: "Generado con Gemini",
  ollama: "Generado con Ollama local (qwen2.5:7b)",
  "plantilla-local": "Generado con plantilla local (sin conexión a un modelo de IA)",
};

export default function AIRecommendationCard({ estudianteId }: { estudianteId: number }) {
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [datos, setDatos] = useState<Recomendacion | null>(null);
  const [agendada, setAgendada] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setEstado("cargando");

    generarRecomendacion(estudianteId)
      .then((res) => {
        if (cancelado) return;
        setDatos(res);
        setEstado("listo");
      })
      .catch(() => {
        if (!cancelado) setEstado("error");
      });

    return () => {
      cancelado = true;
    };
  }, [estudianteId]);

  return (
    <div className="rounded-2xl bg-ink p-6 text-white shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <Sparkles size={18} />
        Recomendación de IA
      </h3>

      {estado === "cargando" && (
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-full rounded bg-white/20" />
          <div className="h-3 w-5/6 rounded bg-white/20" />
          <div className="h-3 w-2/3 rounded bg-white/20" />
        </div>
      )}

      {estado === "error" && (
        <p className="text-sm text-white/80">No se pudo generar la recomendación. Intenta recargar la página.</p>
      )}

      {estado === "listo" && datos && (
        <>
          <p className="text-sm leading-relaxed text-white/90">{datos.explicacion}</p>
          <p className="mt-3 text-sm italic leading-relaxed text-white/90">{datos.recomendacion}</p>
          <p className="mt-3 text-xs text-white/50">{ETIQUETA_FUENTE[datos.fuente]}</p>

          <button
            onClick={() => setAgendada(true)}
            disabled={agendada}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-semibold transition-colors hover:bg-white/20 disabled:opacity-60"
          >
            <CalendarPlus size={16} />
            {agendada ? "Cita agendada" : "Agendar cita de orientación"}
          </button>
        </>
      )}
    </div>
  );
}
