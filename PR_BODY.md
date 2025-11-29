# feat: Add Redis infrastructure and rate limiting middleware

## Summary

This PR introduces Redis infrastructure to the LENS Backend application and implements a comprehensive rate limiting middleware system using `express-rate-limit` with a custom Redis store. This foundation enables distributed rate limiting across multiple instances and prepares the system for future caching and queue implementations.

## Changes Made

### Infrastructure
- **Added Redis service to Docker Compose** (`docker-compose.yml`)
  - Redis 7-alpine image with password authentication
  - Memory limit set to 256MB with LRU eviction policy
  - Health checks configured
  - Persistent volume for data storage

- **Created Redis configuration module** (`rfid-entry-backend/src/config/redis.ts`)
  - ioredis client with connection pooling and retry strategy
  - Health tracking with `isHealthy` flag
  - Connection event handlers for monitoring
  - Test connection utility function

### Rate Limiting Middleware
- **Implemented custom Redis store** (`rfid-entry-backend/src/middleware/rateLimiter.ts`)
  - Custom `RedisStore` class implementing express-rate-limit Store interface
  - Sliding window algorithm using Redis INCR with TTL
  - Graceful fallback to in-memory store when Redis is unavailable
  - Error handling and logging

- **Created multiple rate limiters for different use cases:**
  - `authRateLimiter`: 5 attempts per 15 minutes (login endpoints)
  - `refreshTokenRateLimiter`: 10 attempts per 15 minutes (token refresh)
  - `apiRateLimiter`: 100 requests per 15 minutes (general API)
  - `strictRateLimiter`: 5 attempts per hour (sensitive operations)
  - `readRateLimiter`: 200 requests per minute (read-only endpoints)

- **TypeScript type definitions:**
  - Extended Express Request interface to include `rateLimit` property
  - Proper type safety for rate limit handlers

### Dependencies
- Added `ioredis@^5.8.2` for Redis client
- Added `@types/ioredis@^4.28.10` for TypeScript types
- Using existing `express-rate-limit@^7.1.5`

### Code Quality
- Fixed ESLint warnings in `Admin.ts` model
- Added proper TypeScript type extensions
- Followed project coding standards and conventions

## Technical Details

### Redis Store Implementation
The custom Redis store uses:
- Redis INCR for atomic counter increments
- TTL-based expiration for sliding window behavior
- Pipeline operations for better performance
- Automatic fallback to in-memory store on Redis unavailability

### Rate Limiting Strategy
- **Key Generation**: Uses IP address for unauthenticated requests, admin ID for authenticated requests
- **Headers**: Standard `RateLimit-*` headers for client information
- **Error Handling**: Custom handler returns 429 status with retry-after information

## Testing

### Manual Testing
- [x] Redis container starts successfully with `docker-compose up -d redis`
- [x] Redis connection test passes
- [x] Rate limiter middleware compiles without TypeScript errors
- [x] ESLint passes with no errors

### Verification Steps
1. Start Redis: `docker-compose up -d redis`
2. Verify connection: Check server logs for "Redis connection established successfully"
3. Test rate limiting: Apply middleware to endpoints (next step)

## Next Steps

- [ ] Apply rate limiters to authentication routes (`/api/auth/login`, `/api/auth/refresh`)
- [ ] Apply rate limiters to protected API endpoints
- [ ] Add Redis connection test to server startup sequence
- [ ] Monitor Redis health and performance metrics
- [ ] Consider implementing Redis-based caching for frequently accessed data
- [ ] Consider implementing Redis-based job queues for async operations

## Breaking Changes

None - This is a purely additive change. Rate limiters are not yet applied to routes, so existing functionality remains unchanged.

## Related Issues

N/A

## Checklist

- [x] Code follows project style guidelines
- [x] Self-review completed
- [x] Comments added for complex logic
- [x] Documentation updated (README if needed)
- [x] No new warnings generated
- [x] Tests pass (if applicable)
- [x] Changes are backward compatible

## Screenshots/Logs

```
Redis connection established successfully.
Redis connection test successful.
```

## Notes

- Rate limiters are exported but not yet applied to routes (will be done in follow-up PR)
- Redis password defaults to "changeme" - should be changed in production via environment variable
- Rate limiting gracefully degrades to in-memory store if Redis is unavailable
- All rate limiters use sliding window algorithm for better accuracy


