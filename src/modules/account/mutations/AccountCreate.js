/*
 * IMPORTS
 */
import axios from "axios";
import { createLogger } from "../../../utils/logger.js";
import {
  ValidationError,
  ServiceUnavailableError,
} from "../../../graphql/errorHandling.js";

/*
 * ENV
 */
const ENV = process.env;
const logger = createLogger("gateway:account:create");

/*
 * EXPORTS
 */
export default async function AccountCreate(_, args, context) {
  const startTime = Date.now();

  try {
    // Input validation
    const { email, password, name } = args;

    if (!email || !email.includes("@")) {
      throw new ValidationError("Valid email address is required", "email");
    }

    if (!password || password.length < 6) {
      throw new ValidationError(
        "Password must be at least 6 characters long",
        "password"
      );
    }

    if (!name || name.trim().length < 2) {
      throw new ValidationError(
        "Name must be at least 2 characters long",
        "name"
      );
    }

    logger.info("Account creation started", { email, name }); // Call account_service GraphQL endpoint
    const res = await axios.post(
      `${ENV.ACCOUNT_SERVICE_URL}/graphql`,
      {
        query: `
          mutation($email: String!, $password: String!, $name: String!) {
            AccountCreate(email: $email, password: $password, name: $name) {
              id
              email
              name
              role
              createdAt
            }
          }
        `,
        variables: args,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Handle GraphQL errors
    if (res.data.errors) {
      const msg = res.data.errors[0]?.message || "Account creation failed";
      throw new Error(msg);
    }

    const responseTime = Date.now() - startTime;
    logger.serviceCall("account-service", "AccountCreate", true, responseTime, {
      userId: res.data.data.AccountCreate.id,
    });

    // Return created account
    return res.data.data.AccountCreate;
  } catch (err) {
    const responseTime = Date.now() - startTime;

    // Re-throw validation errors as-is
    if (err instanceof ValidationError) {
      throw err;
    }

    logger.serviceCall(
      "account-service",
      "AccountCreate",
      false,
      responseTime,
      {
        error: err.message,
        email: args.email,
      }
    );

    // Handle different error types
    if (err.code === "ECONNREFUSED") {
      throw new ServiceUnavailableError(
        "Account service",
        "Service is unavailable"
      );
    }

    if (err.response?.status === 400) {
      throw new ValidationError("Invalid account data provided");
    } else if (err.response?.status === 409) {
      throw new ValidationError(
        "Account with this email already exists",
        "email"
      );
    } else if (err.response?.status >= 500) {
      throw new ServiceUnavailableError("Account service");
    }

    logger.error("Account creation failed", err, { email: args.email });
    throw new Error(err.message || "Account creation failed");
  }
}
