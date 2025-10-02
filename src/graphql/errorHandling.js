/*
 * IMPORTS
 */
import { GraphQLError } from "graphql";
import * as Sentry from "@sentry/node";
import { createLogger } from "../utils/logger.js";

/*
 * LOGGER
 */
const logger = createLogger("gateway:graphql:errors");

/*
 * GraphQL Error Formatter
 */
export function formatError(formattedError, error) {
  const { message, locations, path, extensions } = formattedError;

  // Extract original error
  const originalError = error.originalError || error;

  // Create error context
  const errorContext = {
    message,
    locations,
    path,
    extensions,
    stack: originalError.stack,
    name: originalError.name,
    timestamp: new Date().toISOString(),
  };

  // Log the error
  logger.graphqlError("GraphQL Operation", originalError, {
    locations,
    path,
    extensions,
  });

  // Send to Sentry in production
  if (process.env.NODE_ENV === "production") {
    Sentry.withScope((scope) => {
      scope.setTag("error.type", "graphql");
      scope.setContext("graphql", {
        operation: path?.join("."),
        locations,
        extensions,
      });

      if (extensions?.code) {
        scope.setTag("graphql.code", extensions.code);
      }

      Sentry.captureException(originalError);
    });
  }

  // Return sanitized error for client
  const clientError = {
    message: message,
    locations,
    path,
    extensions: {
      code: extensions?.code || "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    },
  };

  // In development, include stack trace
  if (process.env.NODE_ENV === "development") {
    clientError.extensions.stack = originalError.stack;
  }

  return clientError;
}

/*
 * GraphQL Plugin for Enhanced Error Handling
 */
export const errorHandlingPlugin = {
  requestDidStart() {
    return {
      didResolveOperation(requestContext) {
        const { request, operationName } = requestContext;

        logger.debug("GraphQL operation started", {
          operationName,
          query: request.query?.substring(0, 200) + "...",
        });
      },

      didEncounterErrors(requestContext) {
        const { errors, operationName, request } = requestContext;

        errors.forEach((error) => {
          const isUserError =
            error instanceof GraphQLError &&
            ["BAD_USER_INPUT", "FORBIDDEN", "UNAUTHENTICATED"].includes(
              error.extensions?.code
            );

          if (!isUserError) {
            logger.error("GraphQL execution error", error, {
              operationName,
              variables: JSON.stringify(request.variables),
              query: request.query?.substring(0, 200) + "...",
            });
          }
        });
      },

      willSendResponse(requestContext) {
        const { response, operationName } = requestContext;

        if (response.body?.singleResult?.errors?.length > 0) {
          logger.warn("GraphQL response contains errors", {
            operationName,
            errorCount: response.body.singleResult.errors.length,
          });
        }
      },
    };
  },
};

/*
 * Custom Error Classes
 */
export class ValidationError extends GraphQLError {
  constructor(message, field = null) {
    super(message, {
      extensions: {
        code: "BAD_USER_INPUT",
        field,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export class AuthenticationError extends GraphQLError {
  constructor(message = "Authentication required") {
    super(message, {
      extensions: {
        code: "UNAUTHENTICATED",
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export class AuthorizationError extends GraphQLError {
  constructor(message = "Access denied") {
    super(message, {
      extensions: {
        code: "FORBIDDEN",
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export class ServiceUnavailableError extends GraphQLError {
  constructor(service, message = "Service temporarily unavailable") {
    super(`${service}: ${message}`, {
      extensions: {
        code: "SERVICE_UNAVAILABLE",
        service,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
