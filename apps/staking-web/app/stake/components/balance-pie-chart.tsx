'use client';

import * as React from 'react';
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

interface BalanceData {
  readonly name: string;
  readonly value: number;
  readonly color: string;
}

interface BalancePieChartProps {
  readonly data: readonly BalanceData[];
  readonly title?: string;
  readonly description?: React.ReactNode;
  readonly className?: string;
}

interface CustomTooltipProps {
  readonly active?: boolean;
  readonly payload?: Array<{
    name: string;
    value: number;
    payload: { fill: string };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];

  return (
    <div
      className="animate-in fade-in-0 zoom-in-95 slide-in-from-left-2 pointer-events-none rounded-xl border bg-popover px-4 py-3 text-popover-foreground shadow-lg duration-200"
      style={{
        borderColor: data.payload.fill,
        boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 0 1px ${data.payload.fill}33`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-3 shrink-0 rounded-sm"
          style={{ backgroundColor: data.payload.fill }}
        />
        <div>
          <p className="text-xs font-medium text-muted-foreground">{data.name}</p>
          <p className="text-sm font-bold">{data.value.toLocaleString()} MON</p>
        </div>
      </div>
      <div
        className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2"
        style={{
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: `6px solid ${data.payload.fill}`,
        }}
      />
    </div>
  );
}

export function BalancePieChart({
  data,
  title = 'Balance Distribution',
  description = 'MON balance breakdown',
  className = '',
}: BalancePieChartProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const chartData = React.useMemo(
    () => data.map((item) => ({ ...item, fill: item.color })),
    [data]
  );

  // Calculate dynamic font size based on number length
  const getFontSize = (value: number) => {
    const strLength = value.toLocaleString().length;
    if (strLength > 8) return 18;
    if (strLength > 6) return 22;
    if (strLength > 4) return 26;
    return 30;
  };

  return (
    <Card className={`flex flex-col px-5 pb-5 pt-6 ${className}`}>
      <CardHeader className="items-start pb-4">
        <CardTitle className="font-display text-base uppercase tracking-[0.14em] text-primary">
          {title}
        </CardTitle>
        <CardDescription className="text-[11px] tracking-[0.12em] text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-6">
        <div className="mx-auto aspect-square w-full max-w-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                strokeWidth={5}
                activeIndex={activeIndex}
                activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                  <g>
                    <Sector {...props} outerRadius={outerRadius + 10} />
                    <Sector {...props} outerRadius={outerRadius + 25} innerRadius={outerRadius + 12} />
                  </g>
                )}
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--background))" />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      const currentValue = chartData[activeIndex].value;
                      const fontSize = getFontSize(currentValue);

                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground font-bold"
                            style={{ fontSize: `${fontSize}px` }}
                          >
                            {currentValue.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                            style={{ fontSize: '14px' }}
                          >
                            MON
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardContent className="flex flex-col gap-2 border-t-2 border-border pt-4">
        {chartData.map((item, index) => (
          <button
            key={item.name}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            className={`flex items-center justify-between border-2 border-border px-3 py-2 font-display text-[10px] uppercase tracking-[0.12em] transition hover:border-primary ${
              activeIndex === index ? 'bg-secondary/40 text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.fill }} />
              <span>{item.name}</span>
            </div>
            <span className="font-mono text-xs">{item.value.toLocaleString()} MON</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
