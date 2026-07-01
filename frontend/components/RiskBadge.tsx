import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import type { NivelRiesgo } from "@/lib/api";
import { RISK_LABELS, RISK_STYLES } from "@/lib/riskLabels";

const ICONOS: Record<NivelRiesgo, typeof CheckCircle2> = {
  Bajo: CheckCircle2,
  Medio: AlertTriangle,
  Alto: AlertCircle,
};

export default function RiskBadge({ nivel }: { nivel: NivelRiesgo }) {
  const Icono = ICONOS[nivel];
  const estilo = RISK_STYLES[nivel];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${estilo.bg} ${estilo.text}`}
    >
      <Icono size={14} />
      {RISK_LABELS[nivel]}
    </span>
  );
}
