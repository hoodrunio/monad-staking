import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

const requestCounter = new Counter({
  name: 'staking_api_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [metricsRegistry],
});

const requestDuration = new Histogram({
  name: 'staking_api_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export function recordHttpMetrics(params: { method: string; route: string; status: number; durationMs: number }): void {
  const { method, route, status, durationMs } = params;
  const statusLabel = String(status);
  requestCounter.inc({ method, route, status: statusLabel });
  requestDuration.observe({ method, route, status: statusLabel }, durationMs / 1_000);
}

