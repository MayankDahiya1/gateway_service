/*
 * IMPORTS
 */
import axios from "axios";
import debug from "debug";

/*
 * ENV
 */
const ENV = process.env;
const log = debug("gateway:account:create");

/*
 * EXPORTS
 */
export default async function AccountCreate(_, args) {
  try {
    // Input validation
    const { email, password, name } = args;

    if (!email || !email.includes("@")) {
      throw new Error("Valid email address is required");
    }

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    if (!name || name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }

    // Call account_service GraphQL endpoint
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

    // Return created account
    return res.data.data.AccountCreate;
  } catch (err) {
    log("Account creation error:", err.message);

    // Handle different error types
    if (err.code === "ECONNREFUSED") {
      throw new Error("Account service is unavailable");
    }

    if (err.response?.status === 400) {
      throw new Error("Invalid account data provided");
    } else if (err.response?.status === 409) {
      throw new Error("Account with this email already exists");
    } else if (err.response?.status >= 500) {
      throw new Error("Account service temporarily unavailable");
    }

    throw new Error(err.message || "Account creation failed");
  }
}
