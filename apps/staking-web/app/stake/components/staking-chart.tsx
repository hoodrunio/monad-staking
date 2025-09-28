'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DataPoint {
  readonly label: string;
  readonly value: number;
}

interface StakingChartProps {
  readonly data?: readonly DataPoint[];
}

const DEFAULT_DATA: DataPoint[] = [
  { label: 'Jan', value: 250 },
  { label: 'Feb', value: 280 },
  { label: 'Mar', value: 320 },
  { label: 'Apr', value: 380 },
  { label: 'May', value: 420 },
  { label: 'Jun', value: 480 },
  { label: 'Jul', value: 520 },
  { label: 'Aug', value: 580 },
  { label: 'Sep', value: 640 },
  { label: 'Oct', value: 720 },
  { label: 'Nov', value: 780 },
  { label: 'Dec', value: 847 },
];

interface RechartDatum {
  readonly time: string;
  readonly staked: number;
}

function buildChartData(data: readonly DataPoint[]): RechartDatum[] {
  return data.map((entry) => ({ time: entry.label, staked: entry.value }));
}

export function StakingChart({ data = DEFAULT_DATA }: StakingChartProps) {
  const chartData = buildChartData(data);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Total Amount of MON Staked Over Time</h2>
      <div className="h-[200px] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 24, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="stakingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.8 0.18 142)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.8 0.18 142)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.65 0.012 264)', fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'oklch(0.65 0.012 264)', fontSize: 12 }}
              tickFormatter={(value: number) => `${value}M`}
            />
            <Tooltip
              cursor={{ stroke: 'oklch(0.45 0.18 340)', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'oklch(0.1 0.012 264)',
                border: '1px solid oklch(0.18 0.015 264)',
                borderRadius: 12,
                color: 'oklch(0.95 0.005 264)',
              }}
              formatter={(value: number) => [`$${value}M`, 'Staked']}
            />
            <Area type="monotone" dataKey="staked" stroke="oklch(0.8 0.18 142)" strokeWidth={2} fill="url(#stakingGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
