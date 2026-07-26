/**
 * Logging helpers safe to use inside the plain Node.js runner subprocess.
 */
export enum LogLevel {
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export function logWithChannel(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const prefix = `[HUCKLEBERRY ${level}] ${timestamp}:`;

  if (data === undefined) {
    console.log(`${prefix} ${message}`);
    return;
  }

  try {
    if (typeof data === 'object' && data !== null) {
      console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
      return;
    }
  } catch {
    console.log(`${prefix} ${message} [Data could not be stringified]`, data);
    return;
  }

  console.log(`${prefix} ${message}`, data);
}
