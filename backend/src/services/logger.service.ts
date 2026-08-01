type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const configuredLevel = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info')).toLowerCase() as LogLevel;
const activeLevel = LEVEL_WEIGHT[configuredLevel] ? configuredLevel : 'info';

function shouldLog(level: LogLevel) {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[activeLevel];
}

function timestamp(): string {
  return new Date().toISOString();
}

function formatMeta(meta?: unknown) {
  if (!meta) return '';
  if (meta instanceof Error) return ` ${meta.message}`;
  if (typeof meta === 'string') return ` ${meta}`;
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ' [unserializable-meta]';
  }
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (shouldLog('debug')) console.debug(`${timestamp()} [debug] ${message}${formatMeta(meta)}`);
  },
  info(message: string, meta?: unknown) {
    if (shouldLog('info')) console.info(`${timestamp()} [info] ${message}${formatMeta(meta)}`);
  },
  warn(message: string, meta?: unknown) {
    if (shouldLog('warn')) console.warn(`${timestamp()} [warn] ${message}${formatMeta(meta)}`);
  },
  error(message: string, meta?: unknown) {
    if (shouldLog('error')) console.error(`${timestamp()} [error] ${message}${formatMeta(meta)}`);
  }
};
