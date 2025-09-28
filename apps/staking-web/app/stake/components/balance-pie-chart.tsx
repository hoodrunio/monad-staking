'use client';

import { Cell, PieChart, Pie, ResponsiveContainer } from 'recharts';

interface BalanceData {
  readonly name: string;
  readonly value: number;
  readonly color: string;
  readonly label?: string;
}

interface BalancePieChartProps {
  readonly data: readonly BalanceData[];
  readonly total?: string;
  readonly showLabels?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  value: number;
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

export function BalancePieChart({
  data,
  total,
  showLabels = true,
  size = 'md',
  className = '',
}: BalancePieChartProps) {
  const chartSize = {
    sm: { width: 140, height: 140, innerRadius: 34, outerRadius: 52 },
    md: { width: 200, height: 200, innerRadius: 48, outerRadius: 74 },
    lg: { width: 240, height: 240, innerRadius: 56, outerRadius: 90 },
  }[size];

  const containerSize = {
    width: chartSize.width + 120,
    height: chartSize.height + 80,
  };

  const CustomLabel = ({ cx, cy, midAngle, outerRadius, value }: LabelProps) => {
    if (!showLabels || value <= 0) return null;

    const RADIAN = Math.PI / 180;
    const cos = Math.cos(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);
    const lineStartX = cx + outerRadius * cos;
    const lineStartY = cy + outerRadius * sin;
    const lineEndX = cx + (outerRadius + 24) * cos;
    const lineEndY = cy + (outerRadius + 24) * sin;
    const anchorRight = lineEndX >= cx;
    const textX = lineEndX + (anchorRight ? 12 : -12);
    const textY = lineEndY;
    const strokeColor = 'oklch(0.65 0.012 264)';
    const arrowSize = 4;

    const arrowPoints = [
      `${lineStartX},${lineStartY}`,
      `${lineStartX - sin * arrowSize},${lineStartY - cos * arrowSize}`,
      `${lineStartX + sin * arrowSize},${lineStartY + cos * arrowSize}`,
    ].join(' ');

    const formattedValue = `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} MON`;

    return (
      <g>
        <polyline
          points={`${lineStartX},${lineStartY} ${lineEndX},${lineEndY}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <polygon points={arrowPoints} fill={strokeColor} />
        <text
          x={textX}
          y={textY}
          fill="var(--foreground)"
          fontSize={size === 'sm' ? 10 : 12}
          fontWeight={600}
          textAnchor={anchorRight ? 'start' : 'end'}
          dominantBaseline="middle"
        >
          {formattedValue}
        </text>
      </g>
    );
  };

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      <div className="flex-1 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium text-foreground">
              {item.value.toLocaleString('en-US', { maximumFractionDigits: 2 })} MON
            </span>
          </div>
        ))}
      </div>

      <div className="relative overflow-visible">
        <ResponsiveContainer
          width={containerSize.width}
          height={containerSize.height}
          style={{ overflow: 'visible' }}
        >
          <PieChart margin={{ top: 40, right: 52, bottom: 40, left: 52 }}>
            <Pie
              data={data as PieDataItem[]}
              cx="50%"
              cy="50%"
              innerRadius={chartSize.innerRadius}
              outerRadius={chartSize.outerRadius}
              paddingAngle={2}
              dataKey="value"
              label={showLabels ? CustomLabel : false}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {total && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="rounded-full border border-white/10 bg-background/90 px-4 py-2 text-center shadow-lg shadow-black/20">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
              <div className="text-lg font-semibold text-foreground">{total}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
