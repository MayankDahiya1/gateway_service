/*
 * IMPORTS
 */
import { gql } from "graphql-tag"; // gql tag from graphql-tag
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/*
 * CONST
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatSDL = fs.readFileSync(
  path.join(__dirname, "./typeDefs.graphql"),
  "utf8"
);

/*
 * EXPORTS
 */
export const chatTypeDefs = gql`
  ${chatSDL}
`;
