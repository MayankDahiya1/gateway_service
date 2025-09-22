/*
 * IMPORTS
 */
import { rateLimitDirective } from "graphql-rate-limit-directive";
import { accountAuthDirective } from "../modules/account/directives/authDirective.js";

/*
 * RATE LIMIT CONFIG
 */
const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } =
  rateLimitDirective();

/*
 * DIRECTIVE TYPEDEFS EXPORT
 */
export function getDirectiveTypeDefs() {
  return [
    rateLimitDirectiveTypeDefs,
    `directive @accountAuth(accountType: String) on FIELD_DEFINITION`,
  ];
}

/*
 * APPLY DIRECTIVES TO SCHEMA
 */
export function applyDirectives(schema) {
  // Apply rate limiting first
  schema = rateLimitDirectiveTransformer(schema);

  // Then apply authentication
  schema = accountAuthDirective(schema, "accountAuth");

  return schema;
}
