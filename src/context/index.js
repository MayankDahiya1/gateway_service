/*
 * IMPORTS
 */
import jwt from "jsonwebtoken";
import { PubSub } from "graphql-subscriptions";
import { createLogger } from "../utils/logger.js";

/*
 * LOGGING
 */
const logger = createLogger("gateway:context");

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
    logger.debug("Token verified for user:", { userId: decoded.id });
    return { ...decoded, token: token };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      logger.warn("Token expired");
      return null;
    }
    if (err.name === "JsonWebTokenError") {
      logger.debug("Invalid token provided");
      return null;
    }

    logger.warn("Token verification failed", err);
    return null;
  }
};

/*
 * CREATE CONTEXT FUNCTION
 */
export const createContext = async ({ req }) => {
  logger.debug("Creating context for request");

  // Token extraction
  const authHeader = req?.headers?.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : undefined;

  const user = verifyToken(token);

  logger.debug("Context created", {
    userId: user?.id || "anonymous",
    ip: req?.socket?.remoteAddress || "unknown",
    userAgent: req?.headers?.["user-agent"]?.substring(0, 50) + "...",
  });

  return {
    user,
    ip: req?.socket?.remoteAddress || "unknown",
    device: req?.headers?.["user-agent"] || "unknown",
    pubsub,
    logger: createLogger(`gateway:request:${user?.id || "anonymous"}`),
  };
};
