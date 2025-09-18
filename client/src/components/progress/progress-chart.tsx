import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProgressChart() {
  // Mock data for strength progress over time
  const data = [
    { date: '2024-01-01', deadlift: 255, bench: 175, squat: 210 },
    { date: '2024-01-08', deadlift: 260, bench: 177, squat: 215 },
    { date: '2024-01-15', deadlift: 265, bench: 180, squat: 220 },
    { date: '2024-01-22', deadlift: 270, bench: 182, squat: 222 },
    { date: '2024-01-29', deadlift: 275, bench: 185, squat: 225 },
  ];

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
          <Line 
            type="monotone" 
            dataKey="deadlift" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="bench" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="squat" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
