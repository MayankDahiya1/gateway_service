import { gql } from "apollo-server";
import { accountTypeDefs } from "../modules/account/typeDefs.js";
import { chatTypeDefs } from "../modules/chat/typeDefs.js";

const baseTypeDefs = gql`
  type Query
  type Mutation
  type Subscription
`;

export const typeDefs = [baseTypeDefs, accountTypeDefs, chatTypeDefs];
