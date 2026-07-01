import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export default function SummaryCards({ bajo, medio, alto }: { bajo: number; medio: number; alto: number }) {
  const cards = [
    { label: "Sin novedad", valor: bajo, icon: CheckCircle2, iconBg: "bg-black/5", iconText: "text-ink-light" },
    { label: "Por revisar", valor: medio, icon: AlertTriangle, iconBg: "bg-warn-bg", iconText: "text-warn" },
    { label: "Atención prioritaria", valor: alto, icon: AlertCircle, iconBg: "bg-danger-bg", iconText: "text-danger" },
  ];

  return (
    <div className="grid grid-cols-3 gap-5 px-10">
      {cards.map(({ label, valor, icon: Icon, iconBg, iconText }) => (
        <div key={label} className="flex items-center gap-4 rounded-2xl bg-paper p-5 shadow-sm">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${iconBg} ${iconText}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-sm text-ink-light">{label}</p>
            <p className="text-2xl font-bold text-ink">{valor}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
