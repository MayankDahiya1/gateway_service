/*
 * IMPORTS
 */
import AccountCreate from "./mutations/AccountCreate.js";
import AccountLogin from "./mutations/AccountLogin.js";
import AccountTokenGenerate from "./mutations/AccountTokenGenerate.js";
import AccountDelete from "./mutations/AccountDelete.js";

import AccountGetAll from "./queries/AccountGetAll.js";
import AccountGetById from "./queries/AccountGetById.js";

/*
 * ACCOUNT RESOLVERS
 */
const AccountResolvers = {
  Query: {
    AccountGetAll,
    AccountGetById,
  },
  Mutation: {
    AccountCreate,
    AccountLogin,
    AccountTokenGenerate,
    AccountDelete,
  },
};

export default AccountResolvers;
