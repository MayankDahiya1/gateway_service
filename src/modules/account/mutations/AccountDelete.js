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
export default async function AccountDelete(_, __, context) {
  // 1️⃣ Auth check
  if (!context.user || !context.user.id) {
    throw new Error("Unauthorized: User must be logged in");
  }

  try {
    // 2️⃣ Call account_service GraphQL mutation
    const res = await axios.post(
      `${ENV.ACCOUNT_SERVICE_URL}/graphql`,
      {
        query: `
          mutation {
            AccountDelete {
              id
              email
              name
              role
            }
          }
        `,
      },
      {
        headers: {
          Authorization: context.req.headers.authorization, // forward user token
        },
      }
    );

    // 3️⃣ Handle errors
    if (res.data.errors) {
      throw new Error(res.data.errors[0].message || "Account deletion failed");
    }

    // 4️⃣ Return data
    return res.data.data.AccountDelete;
  } catch (err) {
    console.error("Gateway AccountDelete Error:", err.message);
    throw new Error("Account deletion failed at gateway");
  }
}
