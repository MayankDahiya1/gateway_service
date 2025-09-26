/*
 * IMPORTS
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./graphql/typeDefs.js";
import resolvers from "./graphql/resolvers.js";
import { createContext } from "./context/index.js";
import { getDirectiveTypeDefs, applyDirectives } from "./graphql/directives.js";
import debug from "debug";
import dotenv from "dotenv";

/*
 * CONFIG
 */
dotenv.config();

/*
 * LOGGER
 */
const _Log = { server: debug("gateway:server") };

/*
 * EXPRESS APP
 */
const _App = express();

// Security middleware
if (process.env.NODE_ENV === "production") {
  _App.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );
  _App.use(helmet());
} else {
  _App.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  _App.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
    })
  );
}

// Body parser
_App.use(express.json());

/*
 * HEALTH CHECK
 */
_App.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "gateway",
    timestamp: new Date().toISOString(),
  });
});

/*
 * GRAPHQL SCHEMA
 */
const schema = makeExecutableSchema({
  typeDefs: [...getDirectiveTypeDefs(), ...typeDefs],
  resolvers,
});
const finalSchema = applyDirectives(schema);

/*
 * INIT APOLLO
 */
export async function initApollo(app) {
  const server = new ApolloServer({
    schema: finalSchema,
    introspection: process.env.NODE_ENV !== "production",
    cache: "bounded",
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: createContext,
    })
  );

  _Log.server("Apollo Server initialized");

  return finalSchema;
}

/*
 * EXPORT APP
 */
export default _App;
