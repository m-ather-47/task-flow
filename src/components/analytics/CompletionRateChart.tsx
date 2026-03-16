"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: Array<{ date: string; completed: number }>;
}

export function CompletionRateChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Completion Rate (30 days)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} tickMargin={8} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#6366f1"
            fill="#c7d2fe"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
