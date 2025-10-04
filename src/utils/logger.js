/*
 * IMPORTS
 */
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import * as Sentry from "@sentry/node";
import debug from "debug";

/*
 * ENVIRONMENT
 */
const ENV = process.env;
const isDevelopment = ENV.NODE_ENV === "development";
const isProduction = ENV.NODE_ENV === "production";

/*
 * SENTRY TRANSPORT (used only in production)
 */
class SentryTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.name = "sentry";
  }

  log(info, callback) {
    const { level, message, ...meta } = info;

    if (!ENV.SENTRY_DSN) {
      callback();
      return;
    }

    // Only send error/warn logs to Sentry
    if (level === "error") {
      if (meta.error instanceof Error) {
        Sentry.captureException(meta.error, {
          extra: { message, ...meta },
          level: "error",
        });
      } else {
        Sentry.captureMessage(message, {
          level: "error",
          extra: meta,
        });
      }
    } else if (level === "warn") {
      Sentry.captureMessage(message, {
        level: "warning",
        extra: meta,
      });
    }

    callback();
  }
}

/*
 * WINSTON CONFIGURATION
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const transports = [];

// Console (for development)
if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(
          ({ timestamp, level, message, service, ...meta }) => {
            const metaStr =
              Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : "";
            return `${timestamp} [${
              service || "gateway"
            }] ${level}: ${message} ${metaStr}`;
          }
        )
      ),
    })
  );
}

// File transports for production
if (isProduction) {
  transports.push(
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      format: logFormat,
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
    })
  );

  transports.push(
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      format: logFormat,
      maxSize: "20m",
      maxFiles: "7d",
      zippedArchive: true,
    })
  );

  if (ENV.SENTRY_DSN) {
    transports.push(new SentryTransport());
  }
}

// Always write errors to a static file
transports.push(
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: logFormat,
  })
);

/*
 * WINSTON LOGGER
 */
const winstonLogger = winston.createLogger({
  level: isDevelopment ? "debug" : "info",
  format: logFormat,
  defaultMeta: { service: "gateway" },
  transports,
  exitOnError: false,
});

/*
 * LOGGER CLASS
 */
class Logger {
  constructor(module = "gateway") {
    this.module = module;
    this.debugLogger = debug(module);
  }

  debug(message, meta = {}) {
    if (isDevelopment) this.debugLogger(message, meta);
    winstonLogger.debug(message, { module: this.module, ...meta });
  }

  info(message, meta = {}) {
    winstonLogger.info(message, { module: this.module, ...meta });
  }

  warn(message, meta = {}) {
    winstonLogger.warn(message, { module: this.module, ...meta });
  }

  error(message, error = null, meta = {}) {
    const errorMeta = {
      module: this.module,
      ...meta,
    };

    if (error instanceof Error) {
      errorMeta.error = error;
      errorMeta.stack = error.stack;
    }

    winstonLogger.error(message, errorMeta);

    if (isDevelopment) {
      this.debugLogger(`ERROR: ${message}`, error || meta);
    }
  }

  graphqlError(operation, error, variables = {}, context = {}) {
    this.error(`GraphQL ${operation} failed`, error, {
      operation,
      variables,
      userId: context.user?.id,
      ip: context.ip,
    });
  }

  httpRequest(method, url, statusCode, responseTime, meta = {}) {
    const level = statusCode >= 400 ? "warn" : "info";
    this[level](`${method} ${url} ${statusCode}`, {
      method,
      url,
      statusCode,
      responseTime,
      ...meta,
    });
  }

  serviceCall(service, operation, success, responseTime, meta = {}) {
    const level = success ? "info" : "error";
    this[level](`${service} ${operation} ${success ? "success" : "failed"}`, {
      service,
      operation,
      success,
      responseTime,
      ...meta,
    });
  }
}

/*
 * EXPORTS
 */
export const createLogger = (module) => new Logger(module);
export const logger = new Logger("gateway");
export default logger;
