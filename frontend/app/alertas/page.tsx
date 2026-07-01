import TopBar from "@/components/TopBar";
import AlertRow from "@/components/AlertRow";
import { listarEstudiantes } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";

export default async function AlertasPage() {
  let estudiantes;
  try {
    estudiantes = await listarEstudiantes();
  } catch {
    return (
      <div className="px-10 py-8">
        <p className="text-danger">
          No se pudo conectar con el backend. Verifica que el servidor Express y el contenedor de Postgres estén
          corriendo.
        </p>
      </div>
    );
  }

  const alto = estudiantes.filter((e) => e.nivelRiesgo === "Alto");
  const medio = estudiantes.filter((e) => e.nivelRiesgo === "Medio");

  return (
    <div className="pb-10">
      <TopBar title="Alertas" />

      <div className="flex flex-col gap-8 px-10">
        {alto.length === 0 && medio.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl bg-paper p-6 shadow-sm">
            <CheckCircle2 className="text-success" size={22} />
            <p className="text-sm text-ink">Sin novedad: ningún estudiante tiene señales activas esta semana.</p>
          </div>
        ) : (
          <>
            {alto.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-danger">
                  Necesita atención prioritaria ({alto.length})
                </h3>
                <div className="flex flex-col gap-3">
                  {alto.map((estudiante) => (
                    <AlertRow key={estudiante.id} estudiante={estudiante} />
                  ))}
                </div>
              </section>
            )}

            {medio.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-warn">
                  Vale la pena revisar ({medio.length})
                </h3>
                <div className="flex flex-col gap-3">
                  {medio.map((estudiante) => (
                    <AlertRow key={estudiante.id} estudiante={estudiante} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
