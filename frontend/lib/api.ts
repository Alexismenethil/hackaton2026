const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type NivelRiesgo = "Bajo" | "Medio" | "Alto";

export type Estudiante = {
  id: number;
  nombre_ficticio: string;
  grado: string;
  seccion: string;
  clasificacion_socioeconomica: "no_pobre" | "pobre" | "pobre_extremo";
  internet_en_casa: boolean;
  lengua_materna: string;
  distancia_a_escuela_km: string;
  observacion_docente: string;
  situacion_laboral_familiar: string;
  costo_estudio_mensual: string;
  estudiante_trabaja: boolean;
  problemas_salud_antecedentes: string;
  es_foraneo: boolean;
};

export type Senal = {
  tipo: "asistencia" | "notas" | "comprension" | "participacion" | "tareas";
  semana: number;
  valorInicio: number;
  valorFin: number;
  delta: number;
  resumen: string;
};

export type Riesgo = {
  nivel: NivelRiesgo;
  senales: Senal[];
  metricas: {
    asistenciaInicio: number;
    asistenciaFin: number;
    deltaAsistencia: number;
    notasInicio: number;
    notasFin: number;
    deltaNotas: number;
    comprensionInicio: number;
    comprensionFin: number;
    deltaComprension: number;
    participacionInicio: number;
    participacionFin: number;
    deltaParticipacion: number;
    tareasInicio: number;
    tareasFin: number;
    deltaTareas: number;
  };
};

export type SemanaSeguimiento = {
  semana: number;
  asistencia_pct: string;
  promedio_notas: string;
  comprension_lectora: string;
  participacion_score: number;
  tareas_entregadas_pct: string;
};

export type MetricasRecientes = {
  asistencia_ultimas_4_semanas: number | null;
  promedio_notas: number | null;
  comprension_lectora: number | null;
  participacion: number | null;
  tareas_entregadas: number | null;
};

export type EstudianteResumen = {
  id: number;
  nombre_ficticio: string;
  grado: string;
  seccion: string;
  contextoResumen: string[];
  metricasRecientes: MetricasRecientes;
  nivelRiesgo: NivelRiesgo;
  senalPrincipal: string;
  tendenciaAsistencia: number[];
  tendenciaNotas: number[];
};

export type EstudianteDetalle = {
  estudiante: Estudiante;
  historial: SemanaSeguimiento[];
  riesgo: Riesgo;
  metricasRecientes: MetricasRecientes;
};

export type Recomendacion = {
  explicacion: string;
  recomendacion: string;
  fuente: "gemini" | "ollama" | "plantilla-local";
};

export type ConfigSistema = {
  ia: {
    modo: string;
    ordenProveedores: string[];
    personalizado: boolean;
    geminiConfigurado: boolean;
  };
  riesgo: {
    umbrales: {
      asistencia: number;
      notas: number;
      comprension: number;
      participacion: number;
      tareas: number;
    };
    regla: string;
    ventana: string;
  };
  limites: {
    recomendacionesPorVentana: number;
    ventanaMinutos: number;
  };
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status} al llamar ${path}`);
  }
  return res.json();
}

export function listarEstudiantes() {
  return apiFetch<EstudianteResumen[]>("/api/estudiantes");
}

export function obtenerEstudiante(id: string | number) {
  return apiFetch<EstudianteDetalle>(`/api/estudiantes/${id}`);
}

export function generarRecomendacion(id: string | number) {
  return apiFetch<Recomendacion>(`/api/estudiantes/${id}/recomendacion`, { method: "POST" });
}

export function obtenerConfig() {
  return apiFetch<ConfigSistema>("/api/config");
}
