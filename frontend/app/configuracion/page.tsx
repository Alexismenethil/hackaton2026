import TopBar from "@/components/TopBar";
import { obtenerConfig } from "@/lib/api";
import { ShieldCheck, Sparkles, SlidersHorizontal, Gauge } from "lucide-react";

const ETIQUETA_MODO: Record<string, string> = {
  offline: "Offline",
  hybrid: "Híbrido",
  "cloud-first": "Prioriza la nube (por defecto)",
};

const ETIQUETA_PROVEEDOR: Record<string, string> = {
  ollama: "Ollama local (qwen2.5:7b)",
  gemini: "Gemini (nube)",
  "plantilla-local": "Plantilla local (sin IA)",
};

const ETIQUETA_UMBRAL: Record<string, string> = {
  asistencia: "Asistencia",
  notas: "Notas (escala vigesimal)",
  comprension: "Comprensión lectora (escala vigesimal)",
  participacion: "Participación (escala 1-5)",
  tareas: "Tareas entregadas",
};

export default async function ConfiguracionPage() {
  let config;
  try {
    config = await obtenerConfig();
  } catch {
    return (
      <div className="px-10 py-8">
        <p className="text-danger">No se pudo conectar con el backend para leer la configuración.</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <TopBar title="Configuración" />

      <div className="flex flex-col gap-5 px-10">
        <div className="rounded-2xl bg-paper p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-ink-light" />
            <h3 className="text-lg font-bold text-ink">Motor de recomendación de IA</h3>
          </div>
          <p className="text-sm text-ink-light">
            Modo activo: <span className="font-semibold text-ink">{ETIQUETA_MODO[config.ia.modo] || config.ia.modo}</span>
            {config.ia.personalizado && " (orden personalizado vía AI_PROVIDER_ORDER)"}
          </p>
          <p className="mt-1 text-sm text-ink-light">
            Orden de respaldo: {config.ia.ordenProveedores.map((p) => ETIQUETA_PROVEEDOR[p] || p).join(" → ")}
          </p>
          <p className="mt-1 text-sm text-ink-light">
            Gemini {config.ia.geminiConfigurado ? "está configurado" : "no está configurado"} en este servidor.
          </p>
          <p className="mt-3 text-xs text-ink-light/70">
            El motor siempre cae al siguiente nivel si el anterior falla o no está disponible, y la plantilla local
            garantiza una respuesta aunque no haya IA ni conexión a internet.
          </p>
        </div>

        <div className="rounded-2xl bg-paper p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-ink-light" />
            <h3 className="text-lg font-bold text-ink">Regla de riesgo</h3>
          </div>
          <p className="text-sm text-ink-light">{config.riesgo.ventana}.</p>
          <p className="mt-1 text-sm text-ink-light">{config.riesgo.regla}.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {Object.entries(config.riesgo.umbrales).map(([tipo, valor]) => (
              <div key={tipo} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                <span className="text-ink-light">{ETIQUETA_UMBRAL[tipo] || tipo}</span>
                <span className="font-semibold text-ink">cae más de {valor}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-paper p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Gauge size={18} className="text-ink-light" />
            <h3 className="text-lg font-bold text-ink">Límites de uso</h3>
          </div>
          <p className="text-sm text-ink-light">
            Hasta {config.limites.recomendacionesPorVentana} recomendaciones de IA por docente cada{" "}
            {config.limites.ventanaMinutos} minutos, para evitar uso excesivo del modelo.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-6">
          <ShieldCheck className="mt-0.5 shrink-0 text-warn" size={20} />
          <div>
            <h3 className="font-bold text-ink">Privacidad y alcance de esta demo</h3>
            <p className="mt-1 text-sm text-ink">
              Todos los estudiantes de esta demo son ficticios. Para usar datos reales de menores se requiere
              consentimiento informado, acceso autorizado por rol y minimización de información sensible (por
              ejemplo, antecedentes de salud). El riesgo se calcula solo a partir de comportamiento medible
              (asistencia, notas, comprensión, participación, tareas) — nunca a partir de variables demográficas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
