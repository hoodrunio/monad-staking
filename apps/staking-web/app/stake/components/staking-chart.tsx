'use client';

import { Card } from '@/app/components/ui/card';

interface DataPoint {
  readonly label: string;
  readonly value: number;
}

interface StakingChartProps {
  readonly data?: readonly DataPoint[];
}

const DEFAULT_DATA: DataPoint[] = [
  { label: 'Jan', value: 120 },
  { label: 'Feb', value: 145 },
  { label: 'Mar', value: 170 },
  { label: 'Apr', value: 190 },
  { label: 'May', value: 210 },
  { label: 'Jun', value: 240 },
  { label: 'Jul', value: 260 },
  { label: 'Aug', value: 285 },
  { label: 'Sep', value: 310 },
  { label: 'Oct', value: 330 },
  { label: 'Nov', value: 360 },
  { label: 'Dec', value: 385 },
];

export function StakingChart({ data = DEFAULT_DATA }: StakingChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));
  const minValue = Math.min(...data.map((item) => item.value));
  const width = 600;
  const height = 220;
  const paddingX = 20;
  const paddingY = 16;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data
    .map((point, index) => {
      const x = paddingX + (chartWidth / Math.max(1, data.length - 1)) * index;
      const normalized = (point.value - minValue) / Math.max(1, maxValue - minValue);
      const y = paddingY + chartHeight - normalized * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPath = `M ${paddingX} ${paddingY + chartHeight} L ${points} L ${paddingX + chartWidth} ${paddingY + chartHeight} Z`;

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Total amount of MON staked over time</h2>
        <p className="text-sm text-muted-foreground">Rolling staked MON shown per month.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/40 bg-muted/20 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
          <defs>
            <linearGradient id="stakingGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#stakingGradient)" stroke="none" />
          <polyline
            points={points}
            fill="none"
            stroke="oklch(0.488 0.243 264.376)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {data.map((point, index) => {
            const x = paddingX + (chartWidth / Math.max(1, data.length - 1)) * index;
            const normalized = (point.value - minValue) / Math.max(1, maxValue - minValue);
            const y = paddingY + chartHeight - normalized * chartHeight;
            return <circle key={point.label} cx={x} cy={y} r={3} fill="oklch(0.488 0.243 264.376)" />;
          })}
        </svg>
        <div className="mt-4 grid grid-cols-6 gap-2 text-xs text-muted-foreground sm:grid-cols-12">
          {data.map((point) => (
            <span key={point.label} className="truncate text-center">
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
