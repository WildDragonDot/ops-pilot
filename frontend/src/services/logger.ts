type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const metaEnv = (import.meta as any).env || {};
const configuredLevel = (metaEnv.VITE_LOG_LEVEL || (metaEnv.PROD ? 'warn' : 'info')).toLowerCase() as LogLevel;
const activeLevel = LEVEL_WEIGHT[configuredLevel] ? configuredLevel : 'info';

function shouldLog(level: LogLevel) {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[activeLevel];
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (shouldLog('debug')) console.debug('[debug]', message, meta ?? '');
  },
  info(message: string, meta?: unknown) {
    if (shouldLog('info')) console.info('[info]', message, meta ?? '');
  },
  warn(message: string, meta?: unknown) {
    if (shouldLog('warn')) console.warn('[warn]', message, meta ?? '');
  },
  error(message: string, meta?: unknown) {
    if (shouldLog('error')) console.error('[error]', message, meta ?? '');
  }
};
