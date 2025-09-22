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
export default async function AccountGetById(_, args, context) {
  // basic validation
  const { id } = args;
  if (!id) {
    throw new Error("Missing id argument");
  }

  try {
    // call account_service GraphQL endpoint
    const res = await axios.post(
      `${ENV.ACCOUNT_SERVICE_URL}/graphql`,
      {
        query: `
          query($id: ID!) {
            AccountGetById(id: $id) {
              id
              email
              name
              role
              createdAt
              updatedAt
            }
          }
        `,
        variables: { id },
      },
      {
        // forward auth header (if present) so upstream can re-check permissions
        headers: {
          Authorization: context?.req?.headers?.authorization || "",
          "Content-Type": "application/json",
        },
      }
    );

    // propagate upstream errors
    if (res.data.errors) {
      const msg = res.data.errors[0]?.message || "Failed to fetch account";
      throw new Error(msg);
    }

    // return account object
    return res.data.data.AccountGetById;
  } catch (err) {
    console.error("Gateway AccountGetById Error:", err?.message || err);
    throw new Error("Failed to fetch account at gateway");
  }
}
