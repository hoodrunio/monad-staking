'use client';

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

export function StakingChart({ data = DEFAULT_DATA }: StakingChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));
  const minValue = Math.min(...data.map((item) => item.value));
  const width = 600;
  const height = 200;
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Total Amount of MON Staked Over Time</h2>
      <div className="h-[200px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id="stakingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.8 0.18 142)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.8 0.18 142)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#stakingGradient)" stroke="none" />
          <polyline
            points={points}
            fill="none"
            stroke="oklch(0.8 0.18 142)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
