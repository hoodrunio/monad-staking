'use client';

import * as React from 'react';
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BalanceData {
  readonly name: string;
  readonly value: number;
  readonly color: string;
}

interface BalancePieChartProps {
  readonly data: readonly BalanceData[];
  readonly title?: string;
  readonly description?: string;
  readonly className?: string;
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
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="items-start pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-4">
        <div className="mx-auto aspect-square w-full max-w-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  minWidth: '180px',
                }}
                labelStyle={{
                  color: 'hsl(var(--popover-foreground))',
                  fontWeight: 600,
                  fontSize: '14px',
                  marginBottom: '6px',
                  display: 'block',
                }}
                itemStyle={{
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '13px',
                  padding: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                formatter={(value: number) => [
                  <span key="value" style={{ fontWeight: 600, color: 'hsl(var(--popover-foreground))' }}>
                    {value.toLocaleString()} MON
                  </span>
                ]}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
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
      <CardContent className="flex flex-col gap-2 border-t pt-4">
        {chartData.map((item, index) => (
          <button
            key={item.name}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            className={`flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent ${
              activeIndex === index ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.fill }} />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">{item.value.toLocaleString()} MON</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
