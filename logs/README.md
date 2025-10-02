# Logs Directory

This directory contains application logs:

- `error.log` - All error level logs
- `error-YYYY-MM-DD.log` - Daily rotated error logs (production)
- `combined-YYYY-MM-DD.log` - Daily rotated combined logs (production)

## Log Levels

- `error` - Errors and exceptions
- `warn` - Warnings and potential issues
- `info` - General information
- `debug` - Detailed debugging information (development only)

## Rotation Policy

- **Max file size**: 20MB
- **Error logs retention**: 14 days
- **Combined logs retention**: 7 days
- **Compression**: Old logs are gzipped
