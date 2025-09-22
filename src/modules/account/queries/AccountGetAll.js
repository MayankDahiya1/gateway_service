/*
 * IMPORTS
 */
import axios from "axios";

/*
 * ENV
 */
const ENV = process.env;

/*
 * EXPORTS
 */
export default async function AccountGetAll(_, args, context) {
  const res = await axios.post(
    `${ENV.ACCOUNT_SERVICE_URL}/graphql`,
    {
      query: `
        query($limit: Int, $search: String) {
          AccountGetAll(limit: $limit, search: $search) {
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
    { headers: { Authorization: context.req.headers.authorization } }
  );

  return res.data.data.AccountGetAll;
}
