# Production Logging & Error Monitoring Setup

## 🎯 Overview

This gateway service now includes production-grade logging and error monitoring with:

- **Sentry** for production error tracking and monitoring
- **Winston** for structured logging with file rotation
- **Debug** for development debugging
- **Custom GraphQL error handling** with proper categorization

## 📦 Dependencies Installed

```json
{
  "@sentry/node": "^10.17.0",
  "@sentry/integrations": "^7.114.0",
  "winston": "^3.18.3",
  "winston-daily-rotate-file": "^5.0.0"
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=gateway:*

# Production
NODE_ENV=production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
```

### Sentry Setup

1. **Create Sentry Project**: Visit [sentry.io](https://sentry.io) and create a new Node.js project
2. **Get DSN**: Copy your project's DSN from the project settings
3. **Set Environment Variable**: Add `SENTRY_DSN=your-dsn-here` to your production `.env`

## 📁 Logging Structure

### Development Logging

- **Console**: Colorized, human-readable logs
- **File**: `logs/error.log` for errors only
- **Debug**: Namespace-based debug messages (`DEBUG=gateway:*`)

### Production Logging

- **Files**:
  - `logs/error-YYYY-MM-DD.log` - Error logs with daily rotation
  - `logs/combined-YYYY-MM-DD.log` - All logs with daily rotation
- **Sentry**: Automatic error reporting and performance monitoring
- **Retention**: 14 days for errors, 7 days for combined logs

## 🎭 Logger Usage

### Basic Logging

```javascript
import { createLogger } from "../utils/logger.js";

const logger = createLogger("module-name");

// Different log levels
logger.debug("Debug message", { data: "value" });
logger.info("Info message", { userId: 123 });
logger.warn("Warning message", { issue: "description" });
logger.error("Error occurred", error, { context: "additional info" });
```

### Specialized Logging Methods

```javascript
// GraphQL operation logging
logger.graphqlError("AccountCreate", error, variables, context);

// HTTP request logging
logger.httpRequest("POST", "/graphql", 200, 150, { userId: 123 });

// Service calls logging
logger.serviceCall("account-service", "create", true, 250, { userId: 123 });
```

## 🚨 Error Handling

### Custom GraphQL Errors

```javascript
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ServiceUnavailableError,
} from "../graphql/errorHandling.js";

// Input validation
throw new ValidationError("Email is required", "email");

// Authentication required
throw new AuthenticationError("Please login to continue");

// Access denied
throw new AuthorizationError("Admin access required");

// Service down
throw new ServiceUnavailableError(
  "Account service",
  "Database connection failed"
);
```

This setup provides enterprise-grade logging and monitoring for your gateway service! 🎉
