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
  innerRadius: number;
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
    sm: { width: 120, height: 120, innerRadius: 30, outerRadius: 50 },
    md: { width: 160, height: 160, innerRadius: 40, outerRadius: 65 },
    lg: { width: 200, height: 200, innerRadius: 50, outerRadius: 80 },
  }[size];

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: LabelProps) => {
    if (!showLabels || value < 0.1) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={size === 'sm' ? '10' : '12'}
        fontWeight="600"
      >
        {value.toFixed(1)}
      </text>
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

      <div className="relative">
        <ResponsiveContainer width={chartSize.width} height={chartSize.height}>
          <PieChart>
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-lg font-bold text-foreground">{total}</div>
          </div>
        )}
      </div>
    </div>
  );
}
