import type { NivelRiesgo } from "./api";

// Los niveles internos (Bajo/Medio/Alto) impulsan la lógica; el docente ve
// siempre el lenguaje no punitivo de abajo.
export const RISK_LABELS: Record<NivelRiesgo, string> = {
  Bajo: "Sin novedad",
  Medio: "Vale la pena revisar",
  Alto: "Necesita atención prioritaria",
};

export const RISK_STYLES: Record<NivelRiesgo, { bg: string; text: string }> = {
  Bajo: { bg: "bg-success-bg", text: "text-success" },
  Medio: { bg: "bg-warn-bg", text: "text-warn" },
  Alto: { bg: "bg-danger-bg", text: "text-danger" },
};
