/*
 * IMPORTS
 */
import axios from "axios";

/*
 * ENV
 */
let ENV = process.env;

/*
 * EXPORTS
 */
export default async function AccountLogin(_, args, context) {
  try {
    // Call account_service GraphQL mutation
    const res = await axios.post(
      `${ENV.ACCOUNT_SERVICE_URL}/graphql`,
      {
        query: `
      mutation($email: String!, $password: String!) {
        AccountLogin(email: $email, password: $password) {
          accessToken
          refreshToken
          status
          message
          Account {
            id
            email
            name
          }
        }
      }
    `,
        variables: { email: args.email, password: args.password },
      },
      {
        headers: {
          "user-agent": context.device,
          "x-forwarded-for": context.ip,
          "content-type": "application/json",
        },
      }
    );

    // Handle errors
    if (res.data.errors) {
      throw new Error(res.data.errors[0].message || "Account login failed");
    }

    // Return data
    return res.data.data.AccountLogin;
  } catch (err) {
    console.error("Gateway AccountLogin Error:", err.message);
    throw new Error("Account login failed at gateway");
  }
}
