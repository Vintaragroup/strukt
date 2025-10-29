// Minimal centralized error handler used by the API client

export type AppError = {
  message: string;
  code?: string | number;
  severity?: 'info' | 'warn' | 'error';
  shouldRetry?: boolean;
  retryAfter?: number; // ms
  cause?: unknown;
  context?: string;
};

export default class ErrorHandler {
  static parseError(err: unknown): AppError {
    if (typeof err === 'object' && err !== null) {
      // Axios-like error
      const anyErr = err as any;
      const message = anyErr?.response?.data?.message || anyErr?.message || 'Network error';
      const status = anyErr?.response?.status;
      const code = anyErr?.code ?? status;

      return {
        message,
        code,
        severity: status && status >= 500 ? 'error' : 'warn',
        shouldRetry: !status || status >= 500,
        retryAfter: undefined,
        cause: err,
      };
    }

    // Fallback
    return {
      message: String(err ?? 'Unknown error'),
      severity: 'error',
      shouldRetry: false,
    };
  }

  static log(error: AppError, context?: string) {
    const prefix = context ? `[${context}] ` : '';
    // eslint-disable-next-line no-console
    console.error(`${prefix}${error.message}`, { code: error.code, severity: error.severity, cause: error.cause });
  }

  static getUserMessage(error: AppError): string {
    return error.message || 'Something went wrong';
  }
}
