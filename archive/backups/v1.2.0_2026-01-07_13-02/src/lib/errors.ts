export class AppError extends Error {
  constructor(public message: string, public context?: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: string) {
    super(message, context);
    this.name = 'DatabaseError';
  }
}

export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function logError(error: unknown, context: string): void {
  console.error(`[${context}]`, error);
  // Hier könnte später ein Remote-Logging Dienst eingebunden werden
}











