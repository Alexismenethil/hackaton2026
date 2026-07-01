import { ChevronRight, TriangleAlert } from "lucide-react";

// Bitácora de observaciones: mock estático de solo lectura (no viene del
// backend, no hay tabla en el esquema para esto). Se elige una variante fija
// según el id para que la demo no repita el mismo texto en cada estudiante.
const VARIANTES = [
  [
    { titulo: "Retiro temprano por salud", meta: "12 Oct · Reportado por Auxiliar", alerta: false },
    { titulo: "Entrega fuera de fecha: Tarea 4", meta: "05 Oct · Matemáticas", alerta: true },
  ],
  [
    { titulo: "Participó en la feria de ciencias", meta: "08 Oct · Reportado por Tutor", alerta: false },
    { titulo: "Olvidó materiales de clase", meta: "02 Oct · Comunicación", alerta: false },
  ],
  [
    { titulo: "Conversación con apoderado", meta: "10 Oct · Reportado por Dirección", alerta: false },
    { titulo: "Ausencia sin justificar", meta: "03 Oct · Tutoría", alerta: true },
  ],
];

export default function ObservationLog({ estudianteId }: { estudianteId: number }) {
  const entradas = VARIANTES[estudianteId % VARIANTES.length];

  return (
    <div className="rounded-2xl bg-paper p-6 shadow-sm">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-light/70">Bitácora de observaciones</p>
      <div className="divide-y divide-black/5">
        {entradas.map((entrada) => (
          <div
            key={entrada.titulo}
            className="flex items-center justify-between rounded-lg py-3 transition-colors duration-150 first:pt-0 last:pb-0 hover:bg-cream/60"
          >
            <div>
              <p className="font-semibold text-ink">{entrada.titulo}</p>
              <p className="text-xs text-ink-light">{entrada.meta}</p>
            </div>
            {entrada.alerta ? (
              <TriangleAlert className="text-warn" size={18} />
            ) : (
              <ChevronRight className="text-ink-light" size={18} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
