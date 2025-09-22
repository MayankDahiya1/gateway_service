/*
 * IMPORTS
 */
import axios from "axios";
import debug from "debug";

/*
 * ENV
 */
const ENV = process.env;
const log = debug("gateway:account:token");

/*
 * EXPORTS
 */
export default async function AccountTokenGenerate(_, args, context) {
  const { refreshToken } = args;

  // Input validation
  if (!refreshToken || typeof refreshToken !== "string") {
    throw new Error("Valid refresh token is required");
  }

  try {
    const res = await axios.post(
      `${ENV.ACCOUNT_SERVICE_URL}/graphql`,
      {
        query: `
      mutation($refreshToken: String!) {
        AccountTokenGenerate(refreshToken: $refreshToken) {
          accessToken
          refreshToken
          status
          message
        }
      }
    `,
        variables: { refreshToken },
      },
      {
        headers: {
          Authorization: context?.req?.headers?.authorization,
          "Content-Type": "application/json",
          "user-agent": context.device,
          "x-forwarded-for": context.ip,
        },
      }
    );

    return res.data.data.AccountTokenGenerate;
  } catch (err) {
    log("Token generation error:", err.message);

    // Handle different error types
    if (err.code === "ECONNREFUSED") {
      throw new Error("Authentication service is unavailable");
    }

    if (err.response?.status === 401) {
      throw new Error("Invalid or expired refresh token");
    } else if (err.response?.status === 404) {
      throw new Error("Account not found");
    } else if (err.response?.status >= 500) {
      throw new Error("Authentication service temporarily unavailable");
    }

    throw new Error(err.message || "Token generation failed");
  }
}
