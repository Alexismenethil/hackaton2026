"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { SemanaSeguimiento } from "@/lib/api";

export default function EvolutionChart({ historial }: { historial: SemanaSeguimiento[] }) {
  const data = historial.map((h) => ({
    semana: `Sem ${h.semana}`,
    Notas: Number(h.promedio_notas),
    Asistencia: Number(h.asistencia_pct),
  }));

  return (
    <div className="rounded-2xl bg-paper p-6 shadow-sm">
      <h3 className="text-lg font-bold text-ink">Evolución de Desempeño</h3>
      <p className="mb-2 text-sm text-ink-light">Últimas {historial.length} semanas lectivas</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
          <XAxis dataKey="semana" tick={{ fontSize: 12, fill: "#3F5A6B" }} />
          <YAxis yAxisId="notas" domain={[0, 20]} tick={{ fontSize: 12, fill: "#3F5A6B" }} width={30} />
          <YAxis
            yAxisId="asistencia"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#3F5A6B" }}
            width={36}
          />
          <Tooltip />
          <Legend />
          <Line yAxisId="notas" type="monotone" dataKey="Notas" stroke="#2E4756" strokeWidth={2} dot={false} />
          <Line
            yAxisId="asistencia"
            type="monotone"
            dataKey="Asistencia"
            stroke="#D97748"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
