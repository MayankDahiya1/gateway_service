/*
 * IMPORTS
 */
import * as Sentry from "@sentry/node";
import { createLogger } from "./logger.js";

/*
 * LOGGER
 */
const _ErrorLogger = createLogger("error");
const _SentryLogger = createLogger("sentry");

/*
 * INITIALIZE SENTRY
 */
export const initSentry = () => {
  const isProd = process.env.NODE_ENV === "production";
  const dsn = process.env.SENTRY_DSN;

  if (!isProd || !dsn) {
    _SentryLogger.info(
      `Sentry not initialized (NODE_ENV=${
        process.env.NODE_ENV
      }, DSN present=${!!dsn})`
    );
    return null;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "production",
      release: process.env.npm_package_version || "1.0.0",
      integrations: [
        Sentry.httpIntegration({ tracing: true }),
        Sentry.expressIntegration(),
      ],
      sendDefaultPii: false,
      tracesSampleRate: 1.0,
      beforeSend(event) {
        // Sanitize sensitive fields
        if (event.request?.data) {
          delete event.request.data.password;
          delete event.request.data.token;
          delete event.request.data.refreshToken;
        }
        return event;
      },
    });

    _SentryLogger.info("Sentry initialized successfully");
    return Sentry;
  } catch (error) {
    _SentryLogger.error("❌ Failed to initialize Sentry", error);
    return null;
  }
};

/*
 * ERROR TRACKER
 */
export class ErrorTracker {
  static logError(error, context = {}) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      ...context,
    };

    _ErrorLogger.error("❌ Error occurred", error, errorDetails);

    if (process.env.NODE_ENV === "production") {
      Sentry.withScope((scope) => {
        scope.setContext("error_details", errorDetails);

        if (context.userId) scope.setUser({ id: context.userId });
        if (context.service) scope.setTag("service", context.service);
        if (context.operation) scope.setTag("operation", context.operation);

        Sentry.captureException(error);
        _SentryLogger.info(`🛰️ Sent error to Sentry: ${error.message}`);
      });
    }

    return errorDetails;
  }

  static logWarning(message, context = {}) {
    const warningDetails = {
      message,
      level: "warning",
      timestamp: new Date().toISOString(),
      ...context,
    };

    _ErrorLogger.warn("⚠️ Warning: " + message, warningDetails);

    if (process.env.NODE_ENV === "production") {
      Sentry.withScope((scope) => {
        scope.setLevel("warning");
        scope.setContext("warning_details", warningDetails);
        Sentry.captureMessage(message);
      });
    }
  }

  static addBreadcrumb(message, category = "custom", data = {}) {
    if (process.env.NODE_ENV === "production") {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        timestamp: Date.now() / 1000,
      });
    }

    _ErrorLogger.info(`🧭 Breadcrumb: [${category}] ${message}`, data);
  }

  static startTransaction(name, operation = "default") {
    if (process.env.NODE_ENV === "production") {
      return Sentry.startTransaction({ name, op: operation });
    }

    const start = Date.now();
    return {
      finish: () => {
        const duration = Date.now() - start;
        _ErrorLogger.debug(
          `⏱️ Transaction ${name} (${operation}) took ${duration}ms`
        );
      },
    };
  }
}

/*
 * EXPORTS
 */
export default ErrorTracker;
