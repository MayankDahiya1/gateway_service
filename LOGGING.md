# Production Logging & Error Monitoring Setup

## 🎯 Overview

This gateway service now includes production-level logging with Sentry integration and development-friendly debugging.

## 📊 Logging Architecture

### Development Mode

- **Console logging** with colors and formatting
- **Debug logging** with namespace filtering
- **File logging** for errors only
- **Detailed stack traces** included

### Production Mode

- **Structured JSON logs** to files
- **Daily log rotation** with compression
- **Sentry integration** for error tracking
- **No console output** (performance optimized)

## 🔧 Configuration

### Environment Variables

```bash
# Development
NODE_ENV=development
DEBUG=gateway:*
LOG_LEVEL=debug

# Production
NODE_ENV=production
LOG_LEVEL=info
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
SENTRY_ENVIRONMENT=production
```

### Log Levels

- `error` - Errors and exceptions (sent to Sentry)
- `warn` - Warnings and potential issues
- `info` - General application flow
- `debug` - Detailed debugging (development only)

## 📝 Usage Examples

### In Resolvers/Mutations

```javascript
import { createLogger } from "../../../utils/logger.js";
import {
  ValidationError,
  ServiceUnavailableError,
} from "../../../graphql/errorHandling.js";

const logger = createLogger("gateway:account:create");

export default async function AccountCreate(_, args, context) {
  const startTime = Date.now();

  try {
    // Input validation with custom error types
    if (!email || !email.includes("@")) {
      throw new ValidationError("Valid email address is required", "email");
    }

    logger.info("Account creation started", { email });

    // Service call
    const res = await axios.post(url, data);

    // Success logging
    const responseTime = Date.now() - startTime;
    logger.serviceCall("account-service", "AccountCreate", true, responseTime, {
      userId: res.data.data.AccountCreate.id,
    });

    return res.data.data.AccountCreate;
  } catch (err) {
    const responseTime = Date.now() - startTime;

    // Service failure logging
    logger.serviceCall(
      "account-service",
      "AccountCreate",
      false,
      responseTime,
      {
        error: err.message,
      }
    );

    // Handle specific errors
    if (err.code === "ECONNREFUSED") {
      throw new ServiceUnavailableError("Account service");
    }

    logger.error("Account creation failed", err, { email });
    throw err;
  }
}
```

### Custom Error Types

```javascript
// Validation errors (400)
throw new ValidationError("Invalid email format", "email");

// Authentication errors (401)
throw new AuthenticationError("Login required");

// Authorization errors (403)
throw new AuthorizationError("Access denied");

// Service errors (503)
throw new ServiceUnavailableError("Account service", "Database unavailable");
```

## 📈 Monitoring Features

### Automatic Error Tracking

- **GraphQL errors** automatically logged and sent to Sentry
- **Service call failures** tracked with response times
- **Uncaught exceptions** captured and reported
- **Unhandled promise rejections** logged

### Performance Monitoring

- **Service call response times** logged
- **GraphQL operation performance** tracked
- **Request/response logging** with metadata

### Context Enrichment

- **User ID** attached to all logs when available
- **IP address** and **user agent** logged
- **Request correlation IDs** for tracing
- **Service call correlation** for debugging

## 🚀 Production Deployment

### 1. Sentry Setup

```bash
# Create Sentry project at sentry.io
# Get your DSN from project settings
export SENTRY_DSN="https://...@sentry.io/..."
export SENTRY_ENVIRONMENT="production"
```

### 2. Log Directory Setup

```bash
# Ensure logs directory exists and has proper permissions
mkdir -p logs
chmod 755 logs
```

### 3. Log Rotation

- **Error logs**: Kept for 14 days, max 20MB per file
- **Combined logs**: Kept for 7 days, max 20MB per file
- **Automatic compression** of old log files
- **Automatic cleanup** of expired logs

### 4. Environment Variables

```bash
NODE_ENV=production
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=production
```

## 🐛 Development Debugging

### Enable Debug Logging

```bash
# All gateway logs
DEBUG=gateway:*

# Specific modules
DEBUG=gateway:account:*,gateway:chat:*

# Everything (verbose)
DEBUG=*
```

### Log Analysis

```bash
# Watch error logs
tail -f logs/error.log

# Search for specific errors
grep "Account creation failed" logs/error.log

# Monitor service calls
grep "serviceCall" logs/combined.log | jq .
```

## 📊 Sentry Dashboard

### Key Metrics to Monitor

- **Error rate** by service
- **Response time** percentiles
- **Service availability** trends
- **User-specific errors**

### Alerts Setup

- **Error spike detection**
- **Service downtime alerts**
- **Performance degradation**
- **Custom GraphQL operation alerts**

## 🔍 Troubleshooting

### Common Issues

**Logs not appearing in production:**

- Check `NODE_ENV=production` is set
- Verify logs directory permissions
- Ensure `LOG_LEVEL` is appropriate

**Sentry not receiving errors:**

- Verify `SENTRY_DSN` is correct
- Check network connectivity
- Ensure `NODE_ENV=production`

**High log volume:**

- Adjust `LOG_LEVEL` to `warn` or `error`
- Review debug logging in production
- Check log rotation settings

### Log Structure

```json
{
  "timestamp": "2024-10-02T10:30:45.123Z",
  "level": "error",
  "message": "Account creation failed",
  "service": "gateway",
  "module": "gateway:account:create",
  "userId": "user_123",
  "ip": "192.168.1.100",
  "error": {
    "name": "ValidationError",
    "message": "Invalid email format",
    "stack": "..."
  },
  "responseTime": 150,
  "operation": "AccountCreate"
}
```

## 🎯 Best Practices

1. **Use structured logging** with consistent metadata
2. **Log service calls** with response times
3. **Use custom error types** for better categorization
4. **Include correlation IDs** for request tracing
5. **Monitor error rates** and set up alerts
6. **Keep sensitive data** out of logs
7. **Use appropriate log levels** for different environments
8. **Regularly review** and clean up old logs
