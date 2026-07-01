"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function Sparkline({ valores, color }: { valores: number[]; color: string }) {
  const data = valores.map((v, i) => ({ semana: i + 1, valor: v }));

  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
