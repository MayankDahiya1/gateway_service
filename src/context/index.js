/*
 * IMPORTS
 */
import jwt from "jsonwebtoken";
import debug from "debug";
import { PubSub } from "graphql-subscriptions";

/*
 * DEBUG LOGGING
 */
const log = {
  context: debug("app:context"),
  db: debug("app:db"),
};

/*
 * EXPORTS
 */
export const pubsub = new PubSub();

/*
 * TOKEN VERIFICATION
 */
export const verifyToken = (token) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    log.context("Token verified for user:", decoded.id);
    return { ...decoded, token: token };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      log.context("Token expired");
      return null;
    }
    if (err.name === "JsonWebTokenError") {
      log.context("Invalid token provided");
      return null;
    }

    log.context("Token verification failed:", err.message);
    return null;
  }
};

/*
 * CREATE CONTEXT FUNCTION
 */
export const createContext = async ({ req }) => {
  log.context("Creating context for request");

  // Token extraction
  const authHeader = req?.headers?.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : undefined;

  const user = verifyToken(token);

  log.context(
    "Context created - User:",
    user?.id || "anonymous",
    "IP:",
    req?.socket?.remoteAddress || "unknown"
  );

  return {
    user,
    ip: req?.socket?.remoteAddress || "unknown",
    device: req?.headers?.["user-agent"] || "unknown",
    pubsub,
  };
};
