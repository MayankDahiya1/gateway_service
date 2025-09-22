/*
 * IMPORTS
 */
import { defaultFieldResolver, GraphQLError } from "graphql";
import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";

/*
 * FUNCTION
 */
export function accountAuthDirective(schema, directiveName) {
  return mapSchema(schema, {
    // Check each field for the directive
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0];

      if (directive) {
        const { resolve = defaultFieldResolver } = fieldConfig;

        // Wrap resolver with auth logic
        fieldConfig.resolve = async function (source, args, context, info) {
          if (!context.user) {
            throw new GraphQLError("Unauthorized: No user found in context", {
              extensions: { code: "UNAUTHORIZED" },
            });
          }

          // Optional: accountType param check
          if (
            directive.accountType &&
            context.user.role !== directive.accountType
          ) {
            throw new GraphQLError(
              `Forbidden: Requires role ${directive.accountType}`,
              {
                extensions: { code: "FORBIDDEN" },
              }
            );
          }

          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }
    },
  });
}
