import { Briefcase, HeartPulse, Languages, MapPin, Wifi, WifiOff, WalletCards } from "lucide-react";
import type { Estudiante, MetricasRecientes } from "@/lib/api";

const CLASIFICACION: Record<string, string> = {
  no_pobre: "No pobre",
  pobre: "Pobre",
  pobre_extremo: "Pobre extremo",
};

function valorTexto(valor: number | null | undefined, sufijo = "") {
  return valor === null || valor === undefined || Number.isNaN(valor) ? "Sin dato" : `${valor}${sufijo}`;
}

export default function ContextSupportCard({
  estudiante,
  metricas,
}: {
  estudiante: Estudiante;
  metricas?: Partial<MetricasRecientes>;
}) {
  const metricasSeguras = metricas ?? {};
  const internetEnCasa = estudiante.internet_en_casa ?? false;
  const lenguaMaterna = estudiante.lengua_materna ?? "Sin dato";
  const distancia = estudiante.distancia_a_escuela_km ? `${estudiante.distancia_a_escuela_km} km a la escuela` : "Sin dato";
  const costo = estudiante.costo_estudio_mensual ? `S/ ${estudiante.costo_estudio_mensual} al mes` : "Costo sin dato";
  const situacionLaboral = estudiante.situacion_laboral_familiar ?? "Sin dato";
  const salud = estudiante.problemas_salud_antecedentes ?? "Sin antecedentes registrados";

  const items = [
    {
      icono: internetEnCasa ? Wifi : WifiOff,
      etiqueta: "Conectividad",
      valor: internetEnCasa ? "Internet en casa" : "Sin internet en casa",
    },
    {
      icono: Languages,
      etiqueta: "Lengua materna",
      valor: lenguaMaterna,
    },
    {
      icono: MapPin,
      etiqueta: "Distancia",
      valor: distancia,
    },
    {
      icono: WalletCards,
      etiqueta: "CSE y costo",
      valor: `${CLASIFICACION[estudiante.clasificacion_socioeconomica] || "Sin CSE"} · ${costo}`,
    },
    {
      icono: Briefcase,
      etiqueta: "Trabajo",
      valor: estudiante.estudiante_trabaja ? "El estudiante apoya con trabajo" : situacionLaboral,
    },
    {
      icono: HeartPulse,
      etiqueta: "Salud",
      valor: salud,
    },
  ];

  return (
    <div className="rounded-2xl bg-paper p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-light/70">Contexto de apoyo</p>
        <p className="mt-1 text-sm text-ink-light">
          Estos datos adaptan la intervención; no determinan el nivel de riesgo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ icono: Icono, etiqueta, valor }) => (
          <div key={etiqueta} className="flex items-start gap-3 rounded-xl bg-cream p-3">
            <Icono className="mt-0.5 shrink-0 text-ink-light" size={18} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-light/70">{etiqueta}</p>
              <p className="text-sm font-semibold text-ink">{valor}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-cream p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-light/70">Últimas 4 semanas</p>
        <p className="mt-1 text-sm text-ink">
          Asistencia {valorTexto(metricasSeguras.asistencia_ultimas_4_semanas, "%")} · Notas{" "}
          {valorTexto(metricasSeguras.promedio_notas)} · Lectura {valorTexto(metricasSeguras.comprension_lectora)} · Tareas{" "}
          {valorTexto(metricasSeguras.tareas_entregadas, "%")}
        </p>
      </div>

      <p className="mt-4 text-sm italic text-ink-light">
        {estudiante.observacion_docente ?? "Sin observación docente registrada."}
      </p>
    </div>
  );
}
