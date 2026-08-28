/**
 * Açaí da Rose — Sistema Unificado de Logger Estruturado e Telemetria
 * Funciona de forma segura tanto no ambiente Node.js (Backend) quanto no Browser (Frontend).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit'

export interface LogContext {
  tenantId?: string
  tenantSlug?: string
  userId?: string
  userName?: string
  action?: string
  endpoint?: string
  durationMs?: number
  [key: string]: any
}

export interface StructuredLog {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class AppLogger {
  private isServer = typeof window === 'undefined'
  private isDev = process.env.NODE_ENV !== 'production'

  private formatLog(level: LogLevel, message: string, context?: LogContext, err?: Error): StructuredLog {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: err ? { name: err.name, message: err.message, stack: err.stack } : undefined,
    }
  }

  private output(log: StructuredLog) {
    const formatted = `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    
    switch (log.level) {
      case 'error':
        console.error(formatted, log.context || '', log.error || '')
        break
      case 'warn':
        console.warn(formatted, log.context || '')
        break
      case 'audit':
        console.info(`🔒 [AUDIT] ${formatted}`, log.context || '')
        break
      case 'debug':
        if (this.isDev) console.debug(formatted, log.context || '')
        break
      default:
        console.log(formatted, log.context || '')
    }

    // Se estiver no browser e for erro crítico, envia telemetria para o backend
    if (!this.isServer && log.level === 'error') {
      this.sendClientTelemetry(log)
    }
  }

  private sendClientTelemetry(log: StructuredLog) {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/telemetry/errors', JSON.stringify(log))
      } else {
        fetch('/api/telemetry/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log),
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Ignora falha de envio silenciosamente para não quebrar a UI
    }
  }

  debug(message: string, context?: LogContext) {
    this.output(this.formatLog('debug', message, context))
  }

  info(message: string, context?: LogContext) {
    this.output(this.formatLog('info', message, context))
  }

  warn(message: string, context?: LogContext) {
    this.output(this.formatLog('warn', message, context))
  }

  error(message: string, err?: Error | unknown, context?: LogContext) {
    const errorObj = err instanceof Error ? err : typeof err === 'string' ? new Error(err) : undefined
    this.output(this.formatLog('error', message, context, errorObj))
  }

  audit(action: string, message: string, context?: LogContext) {
    this.output(this.formatLog('audit', message, { ...context, action }))
  }
}

export const logger = new AppLogger()
