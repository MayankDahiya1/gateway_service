/*
 * IMPORTS
 */
import http from "http";
import debug from "debug";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import _App, { initApollo } from "./app.js";
import { verifyToken } from "./context/index.js";
import { initKafka } from "./kafka/kafkaClient.js";

/*
 * LOGGER
 */
const _Log = { server: debug("gateway:server") };

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
          };
        },
      },
      wsServer
    );

    // Initialize Kafka
    await initKafka();

    // Start server
    httpServer.listen(PORT, () => {
      _Log.server(`Gateway running at http://localhost:${PORT}/graphql`);
      _Log.server(`Subscriptions ready at ws://localhost:${PORT}/graphql`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      _Log.server("Shutting down gateway...");
      httpServer.close(() => process.exit(0));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    _Log.server("Gateway failed to start:", err);
    process.exit(1);
  }
}

startServer();
