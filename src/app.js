/*
 * IMPORTS
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./graphql/typeDefs.js";
import resolvers from "./graphql/resolvers.js";
import { createContext } from "./context/index.js";
import { getDirectiveTypeDefs, applyDirectives } from "./graphql/directives.js";
import { createLogger } from "./utils/logger.js";
import ErrorTracker, { initSentry } from "./utils/ErrorTracker.js";
import dotenv from "dotenv";

/*
 * CONFIG
 */
dotenv.config();

/*
 * LOGGER
 */
const _Log = createLogger("gateway:app");

/*
 * EXPRESS APP
 */
const _App = express();

/*
 * INITIALIZE SENTRY (from ErrorTracker.js)
 */
const sentryInitialized = initSentry();

/*
 * SENTRY MIDDLEWARE — must be added before any routes
 * (Only add if Sentry was successfully initialized)
 */
if (sentryInitialized) {
  _App.use(Sentry.Handlers.requestHandler());
  _App.use(Sentry.Handlers.tracingHandler());
}

/*
 * SECURITY + CORS
 */
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

/*
 * BODY PARSER
 */
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
  const { formatError, errorHandlingPlugin } = await import(
    "./graphql/errorHandling.js"
  );

  const server = new ApolloServer({
    schema: finalSchema,
    introspection: process.env.NODE_ENV !== "production",
    cache: "bounded",
    formatError,
    plugins: [errorHandlingPlugin],
    includeStacktraceInErrorResponses: process.env.NODE_ENV === "development",
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: createContext,
    })
  );

  _Log.info("🚀 Apollo Server initialized successfully");

  return finalSchema;
}

/*
 * SENTRY ERROR HANDLER (must come after routes)
 */
if (sentryInitialized) {
  _App.use(Sentry.Handlers.errorHandler());
}

/*
 * GLOBAL FALLBACK ERROR HANDLER
 */
_App.use((err, req, res, next) => {
  ErrorTracker.logError(err, {
    service: "gateway",
    route: req.originalUrl,
    method: req.method,
  });

  _Log.error("Unhandled Error", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/*
 * EXPORT APP
 */
export default _App;
