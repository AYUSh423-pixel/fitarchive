/**
 * Structured Logging Utility
 * Provides consistent, structured logging with security-aware redaction
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
}

// Sensitive keys that should never be logged
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'auth',
  'creditCard',
  'ssn',
  'apiKey',
  'api_key',
  'serviceKey',
  'service_key',
  'privateKey',
  'private_key',
]);

function redactSensitive(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSensitive);
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (Array.from(SENSITIVE_KEYS).some((k: string) => lowerKey.includes(k))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

class Logger {
  private minLevel: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, userId?: string, requestId?: string) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? redactSensitive(context) as Record<string, unknown> : undefined,
      userId: userId ? this.hashUserId(userId) : undefined,
      requestId,
    };

    // Console output with colors for development
    const color = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    }[level];

    const reset = '\x1b[0m';
    const prefix = `${color}[${level.toUpperCase()}]${reset}`;

    if (process.env.NODE_ENV === 'production') {
      // JSON for log aggregation (Datadog, CloudWatch, etc.)
      console.log(JSON.stringify(entry));
    } else {
      // Human-readable for development
      console.log(`${prefix} ${entry.timestamp} ${message}`, entry.context || '');
    }
  }

  private hashUserId(userId: string): string {
    // Hash user ID for privacy in logs
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash |= 0;
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }

  debug(message: string, context?: Record<string, unknown>, userId?: string, requestId?: string) {
    this.log('debug', message, context, userId, requestId);
  }

  info(message: string, context?: Record<string, unknown>, userId?: string, requestId?: string) {
    this.log('info', message, context, userId, requestId);
  }

  warn(message: string, context?: Record<string, unknown>, userId?: string, requestId?: string) {
    this.log('warn', message, context, userId, requestId);
  }

  error(message: string, context?: Record<string, unknown>, userId?: string, requestId?: string) {
    this.log('error', message, context, userId, requestId);
  }

  // Security event logging
  security(event: string, context?: Record<string, unknown>, userId?: string, requestId?: string) {
    this.warn(`SECURITY: ${event}`, context, userId, requestId);
  }

  // Audit logging for sensitive actions
  audit(action: string, context?: Record<string, unknown>, userId?: string, requestId?: string) {
    this.info(`AUDIT: ${action}`, context, userId, requestId);
  }
}

export const logger = new Logger();

// Request ID middleware helper
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}