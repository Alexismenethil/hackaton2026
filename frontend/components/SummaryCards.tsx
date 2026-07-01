import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export default function SummaryCards({ bajo, medio, alto }: { bajo: number; medio: number; alto: number }) {
  const cards = [
    { label: "Sin novedad", valor: bajo, icon: CheckCircle2, iconBg: "bg-black/5", iconText: "text-ink-light" },
    { label: "Por revisar", valor: medio, icon: AlertTriangle, iconBg: "bg-warn-bg", iconText: "text-warn" },
    { label: "Atención prioritaria", valor: alto, icon: AlertCircle, iconBg: "bg-danger-bg", iconText: "text-danger" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:gap-3 sm:px-6 md:gap-4 md:px-10 lg:gap-5">
      {cards.map(({ label, valor, icon: Icon, iconBg, iconText }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl bg-paper p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:gap-4 md:p-5"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full md:h-11 md:w-11 ${iconBg} ${iconText}`}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm leading-snug text-ink-light">{label}</p>
            <p className="text-2xl font-bold text-ink">{valor}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
