import TopBar from "@/components/TopBar";
import SummaryCards from "@/components/SummaryCards";
import StudentCard from "@/components/StudentCard";
import { listarEstudiantes } from "@/lib/api";

export default async function ResumenPage() {
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

  const conteos = { Bajo: 0, Medio: 0, Alto: 0 };
  for (const e of estudiantes) conteos[e.nivelRiesgo]++;

  return (
    <div className="pb-10">
      <TopBar title="Panel de Control" />
      <SummaryCards bajo={conteos.Bajo} medio={conteos.Medio} alto={conteos.Alto} />

      <div className="px-10 pt-8">
        <h3 className="mb-4 text-lg font-bold text-ink">Mis Estudiantes</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {estudiantes.map((estudiante) => (
            <StudentCard key={estudiante.id} estudiante={estudiante} />
          ))}
        </div>
      </div>
    </div>
  );
}
