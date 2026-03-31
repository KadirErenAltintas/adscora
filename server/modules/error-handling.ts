/**
 * Production-grade error handling and logging
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_EMAIL: "INVALID_EMAIL",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  OWNERSHIP_MISMATCH: "OWNERSHIP_MISMATCH",

  // Business logic errors
  LIMIT_EXCEEDED: "LIMIT_EXCEEDED",
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  PLAN_UPGRADE_REQUIRED: "PLAN_UPGRADE_REQUIRED",

  // External service errors
  LLM_ERROR: "LLM_ERROR",
  ADS_API_ERROR: "ADS_API_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
};

/**
 * Create a user-friendly error message
 */
export function getUserMessage(error: AppError): string {
  const messages: Record<string, string> = {
    [ErrorCodes.UNAUTHORIZED]: "Please log in to continue.",
    [ErrorCodes.FORBIDDEN]: "You don't have permission to access this.",
    [ErrorCodes.SESSION_EXPIRED]: "Your session has expired. Please log in again.",
    [ErrorCodes.INVALID_INPUT]: "Please check your input and try again.",
    [ErrorCodes.MISSING_REQUIRED_FIELD]: "Some required fields are missing.",
    [ErrorCodes.NOT_FOUND]: "The resource you're looking for doesn't exist.",
    [ErrorCodes.ALREADY_EXISTS]: "This item already exists.",
    [ErrorCodes.OWNERSHIP_MISMATCH]: "You don't own this resource.",
    [ErrorCodes.LIMIT_EXCEEDED]: "You've reached your usage limit. Upgrade your plan to continue.",
    [ErrorCodes.INSUFFICIENT_CREDITS]: "You don't have enough credits. Add more to continue.",
    [ErrorCodes.PLAN_UPGRADE_REQUIRED]: "This feature requires a higher plan.",
    [ErrorCodes.LLM_ERROR]: "AI analysis failed. Please try again.",
    [ErrorCodes.ADS_API_ERROR]: "Failed to connect to ad platform. Please check your credentials.",
    [ErrorCodes.STORAGE_ERROR]: "Failed to save your data. Please try again.",
    [ErrorCodes.INTERNAL_ERROR]: "Something went wrong. Our team has been notified.",
    [ErrorCodes.SERVICE_UNAVAILABLE]: "Service is temporarily unavailable. Please try again later.",
  };

  return messages[error.code] || error.message;
}

/**
 * Logger utility
 */
export class Logger {
  static info(message: string, data?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || "");
  }

  static warn(message: string, data?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || "");
  }

  static error(message: string, error?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || "");
  }

  static debug(message: string, data?: any) {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || "");
    }
  }
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private window: number; // in seconds

  constructor(limit: number = 10, window: number = 60) {
    this.limit = limit;
    this.window = window;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.window * 1000;

    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter((time) => time > windowStart);

    if (recentRequests.length >= this.limit) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.window * 1000;

    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter((time) => time > windowStart);

    return Math.max(0, this.limit - recentRequests.length);
  }
}

/**
 * Validation helpers
 */
export const Validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  positiveNumber: (num: any): boolean => {
    return typeof num === "number" && num > 0;
  },

  nonNegativeNumber: (num: any): boolean => {
    return typeof num === "number" && num >= 0;
  },

  stringLength: (str: string, min: number, max: number): boolean => {
    return typeof str === "string" && str.length >= min && str.length <= max;
  },
};
