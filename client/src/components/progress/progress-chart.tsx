import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PersonalRecord } from '@shared/schema';

interface ProgressChartProps {
  personalRecords?: PersonalRecord[];
}

export default function ProgressChart({ personalRecords = [] }: ProgressChartProps) {
  const data = useMemo(() => {
    const recordsByDate: { [date: string]: { date: string; [key: string]: any } } = {};

    personalRecords.forEach(pr => {
      const dateStr = new Date(pr.date).toISOString().split('T')[0];
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = { date: dateStr };
      }
      const exerciseKey = pr.exerciseName.toLowerCase().replace(/\s+/g, '');
      recordsByDate[dateStr][exerciseKey] = pr.weight;
    });

    return Object.values(recordsByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [personalRecords]);

  const exerciseKeys = useMemo(() => {
    const keys = new Set<string>();
    personalRecords.forEach(pr => keys.add(pr.exerciseName.toLowerCase().replace(/\s+/g, '')));
    return Array.from(keys);
  }, [personalRecords]);

  const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        Log some personal records to see your progress chart.
      </div>
    );
  }

  return (
    <div className="h-64" data-testid="chart-progress">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number, name: string) => [`${value} lbs`, name.charAt(0).toUpperCase() + name.slice(1)]}
          />
          {exerciseKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={chartColors[index % chartColors.length]}
              strokeWidth={2}
              dot={{ fill: chartColors[index % chartColors.length], strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
