# Logger Utilities

Logging utilities for the TrustCafe application.

## Overview

This utility provides a consistent logging interface for the application, with support for different log levels and formatted output. It helps with debugging and monitoring the application's behavior.

## Functions

The logger utility exports a logger object with the following methods:

### `logger.debug(...args: any[]): void`

Logs debug messages with a timestamp.

**Parameters:**
- `args`: The values to log

### `logger.log(...args: any[]): void`

Logs standard messages with a timestamp.

**Parameters:**
- `args`: The values to log

### `logger.info(...args: any[]): void`

Logs informational messages with a timestamp.

**Parameters:**
- `args`: The values to log

### `logger.warn(...args: any[]): void`

Logs warning messages with a timestamp.

**Parameters:**
- `args`: The values to log

### `logger.error(...args: any[]): void`

Logs error messages with a timestamp.

**Parameters:**
- `args`: The values to log

## Usage Example

```typescript
import { logger } from '~/utils/logger';

// Log messages at different levels
logger.debug('Debugging information', { data: 'value' });
logger.log('Standard log message');
logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error message', new Error('Something went wrong'));
```

## Implementation Details

The logger utility uses the `chalk` library to add color-coding to log messages in development environments. Each log level has a distinct color to make it easier to identify the type of message:

- Debug: Gray
- Log: White
- Info: Blue
- Warn: Yellow
- Error: Red

In production environments, the logger may be configured to only show messages above a certain log level to reduce noise.
