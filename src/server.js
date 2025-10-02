/*
 * SENTRY INITIALIZATION (Must be first import)
 */
import * as Sentry from "@sentry/node";

// Initialize Sentry before other imports
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      Sentry.nodeProfilingIntegration(),
      Sentry.httpIntegration({ tracing: true }),
      Sentry.expressIntegration({ app: null }),
    ],
  });
}

/*
 * IMPORTS
 */
import http from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import _App, { initApollo } from "./app.js";
import { verifyToken } from "./context/index.js";
import { initKafka, consumer } from "./kafka/kafkaClient.js";
import { createLogger } from "./utils/logger.js";

/*
 * LOGGER
 */
const _Log = createLogger("gateway:server");

/*
 * START SERVER
 */
async function startServer() {
  try {
    const PORT = process.env.PORT || 4000;

    const httpServer = http.createServer(_App);

    // Init Apollo & get schema
    const schema = await initApollo(_App);

    // Set up WebSocket server for subscriptions
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: "/graphql",
    });

    useServer(
      {
        schema,
        context: async (ctx) => {
          const authHeader =
            ctx.connectionParams?.authorization ||
            ctx.connectionParams?.Authorization ||
            "";

          const token = authHeader.startsWith("Bearer ")
            ? authHeader.replace("Bearer ", "")
            : undefined;

          // Verify the JWT token if provided
          const user = token ? verifyToken(token) : null;

          return {
            user,
            ip: ctx.extra?.request?.socket?.remoteAddress || "unknown",
            device: "websocket",
            logger: _Log,
          };
        },
      },
      wsServer
    );

    // Initialize Kafka
    await initKafka();

    // Start server
    httpServer.listen(PORT, () => {
      _Log.info(`Gateway running at http://localhost:${PORT}/graphql`);
      _Log.info(`Subscriptions ready at ws://localhost:${PORT}/graphql`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      _Log.info("Shutting down gateway...");

      try {
        await consumer.disconnect();
        _Log.info("Kafka consumer disconnected");
      } catch (err) {
        _Log.error("Error disconnecting Kafka consumer", err);
      }

      httpServer.close(() => {
        _Log.info("Gateway server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      _Log.error("Uncaught Exception", err);
      Sentry.captureException(err);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      _Log.error("Unhandled Rejection at Promise", reason, { promise });
      Sentry.captureException(reason);
    });
  } catch (err) {
    _Log.error("Gateway failed to start", err);
    Sentry.captureException(err);
    process.exit(1);
  }
}

startServer();
