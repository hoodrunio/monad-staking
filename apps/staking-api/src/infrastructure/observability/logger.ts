import winston from 'winston';

const level = process.env.LOG_LEVEL ?? 'info';
const pretty = (process.env.LOG_PRETTY ?? '').toLowerCase() === 'true' || (process.stdout.isTTY && process.env.NODE_ENV !== 'production');

const service = process.env.LOG_SERVICE ?? 'staking-api';

const baseFormats = [
  winston.format.timestamp({ format: () => new Date().toISOString() }),
  winston.format.errors({ stack: true }),
];

const jsonFormat = winston.format.combine(...baseFormats, winston.format.json());

const colorFormat = winston.format.combine(
  ...baseFormats,
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { level: lvl, message, timestamp, stack, ...rest } = info as Record<string, unknown>;
    const fields = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
    return `${timestamp} ${String(lvl)} ${String(message)}${stack ? `\n${String(stack)}` : ''}${fields}`;
  }),
);

export const logger = winston.createLogger({
  level,
  format: pretty ? colorFormat : jsonFormat,
  defaultMeta: { service },
  transports: [new winston.transports.Console({ level })],
});

