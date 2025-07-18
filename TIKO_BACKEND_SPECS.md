# Tiko Backend Specifications

## Overview

This document outlines the complete backend architecture for Tiko, built with Laravel. The system is designed to be versatile, scalable, and maintainable while supporting all current Supabase functionality plus additional features.

## Technology Stack

- **Framework**: Laravel 11
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: Laravel Sanctum + Socialite
- **Real-time**: Laravel Reverb (WebSockets) / Server-Sent Events
- **File Storage**: S3-compatible (AWS S3, MinIO)
- **Queue System**: Laravel Horizon (Redis)
- **Search**: Laravel Scout (Meilisearch/Algolia)
- **Monitoring**: Laravel Telescope, Pulse

## Core Features

### 1. Universal Data Storage System

The backend uses a flexible, app-agnostic data model that can store any type of data from any app.

#### Database Schema

```sql
-- Core items table for all app data
items
├── id
├── user_id (foreign key)
├── app_name (string: 'radio', 'todo', 'cards', etc.)
├── type (string: 'audio', 'task', 'card', etc.)
├── status (string: 'active', 'archived', 'deleted')
├── data (JSONB: flexible app-specific data)
├── metadata (JSONB: system metadata)
├── sort_order (integer)
├── parent_id (nullable: for hierarchical data)
└── timestamps

-- Collections for grouping items
collections
├── id
├── user_id
├── app_name
├── type (string: 'playlist', 'deck', 'category')
├── name
├── settings (JSONB)
├── sort_order
└── timestamps

-- Many-to-many relationship
item_collections
├── item_id
├── collection_id
├── sort_order
└── metadata (JSONB)

-- Generic relationships between items
relationships
├── source_id
├── target_id
├── type (string: 'parent_child', 'related')
└── metadata (JSONB)

-- Tags system
tags
├── id
├── name
├── app_name (nullable: null = global tag)
└── color

item_tags
├── item_id
└── tag_id

-- App-specific settings
app_settings
├── user_id
├── app_name
└── settings (JSONB)
```

#### API Endpoints

All apps use the same RESTful API structure:

```
GET    /api/v1/{app}/items                 # List items
POST   /api/v1/{app}/items                 # Create item
GET    /api/v1/{app}/items/{id}            # Get item
PUT    /api/v1/{app}/items/{id}            # Update item
DELETE /api/v1/{app}/items/{id}            # Delete item
POST   /api/v1/{app}/items/batch           # Batch operations
PUT    /api/v1/{app}/items/reorder         # Reorder items

GET    /api/v1/{app}/collections           # List collections
POST   /api/v1/{app}/collections           # Create collection
POST   /api/v1/{app}/collections/{id}/items # Add items to collection

GET    /api/v1/{app}/search                # Search items
GET    /api/v1/{app}/settings              # Get app settings
PUT    /api/v1/{app}/settings              # Update app settings
```

### 2. Authentication System

Multi-provider authentication with comprehensive session management.

#### Features

- **Email/Password**: Traditional authentication with validation
- **Passwordless Email**: OTP-based magic links
- **OAuth Providers**: Apple, Google, GitHub via Laravel Socialite
- **Session Management**: Device tracking, concurrent sessions, revocation
- **2FA Support**: TOTP-based two-factor authentication
- **API Keys**: For third-party integrations

#### Database Schema

```sql
-- Users table
users
├── id
├── email (unique, nullable)
├── password (nullable)
├── name
├── avatar
├── auth_provider (enum: 'email', 'apple', 'google', 'github')
├── provider_id
├── email_verified_at
├── preferences (JSONB)
└── timestamps

-- Social accounts for multiple providers
social_accounts
├── user_id
├── provider
├── provider_id
└── provider_data (JSONB)

-- Parent mode PIN system
parent_pins
├── user_id
├── pin_hash
├── salt
├── enabled
├── failed_attempts
├── locked_until
└── settings (JSONB: timeout, permissions)

-- Session tracking
auth_sessions
├── user_id
├── token_hash
├── device_name
├── device_id
├── ip_address
├── user_agent
├── last_activity
├── expires_at
├── parent_mode_unlocked
└── parent_mode_expires
```

#### API Endpoints

```
POST   /api/auth/register                  # Email registration
POST   /api/auth/login                     # Email/password login
POST   /api/auth/otp/send                  # Send OTP
POST   /api/auth/otp/verify                # Verify OTP
GET    /api/auth/{provider}/redirect       # OAuth redirect
GET    /api/auth/{provider}/callback       # OAuth callback

# Authenticated routes
POST   /api/auth/logout                    # Logout current session
POST   /api/auth/logout-all                # Logout all sessions
GET    /api/auth/sessions                  # List active sessions
DELETE /api/auth/sessions/{id}             # Revoke specific session

# Parent mode
POST   /api/auth/parent-mode/setup         # Setup PIN
POST   /api/auth/parent-mode/verify        # Verify PIN
POST   /api/auth/parent-mode/lock          # Lock parent mode
GET    /api/auth/parent-mode/status        # Check status
```

### 3. Real-time Features

WebSocket-based real-time functionality using Laravel Reverb.

#### Features

- **Item Updates**: Real-time sync across devices
- **Presence Channels**: See who's online
- **Collaboration**: Shared timers, live voting
- **Notifications**: Push notifications
- **Activity Tracking**: Live user activity

#### Broadcasting Events

```php
// Automatic broadcasting of data changes
ItemUpdated::class         # When items are created/updated/deleted
CollaborationEvent::class  # For collaborative features
NotificationEvent::class   # Push notifications
PresenceUpdate::class      # User presence changes
```

#### Channels

```
Private Channels:
- user.{userId}                    # User-specific updates
- app.{appName}.{userId}           # App-specific updates

Presence Channels:
- collab.{roomId}                  # Collaboration rooms
- app.{appName}.presence           # App-wide presence

Public Channels:
- app.{appName}.public             # Public broadcasts
```

### 4. File Storage & Media

S3-compatible storage with automatic processing and CDN delivery.

#### Features

- **Direct Uploads**: Presigned URLs for client uploads
- **Image Processing**: Automatic thumbnails, format conversion
- **Video Processing**: Transcoding, thumbnail extraction
- **CDN Integration**: Optimized delivery
- **Security**: Private storage with signed URLs

#### Database Schema

```sql
-- Media files
media
├── id
├── mediable_type (polymorphic)
├── mediable_id
├── collection
├── disk
├── path
├── filename
├── mime_type
├── size
├── metadata (JSONB: dimensions, duration)
├── conversions (JSONB: thumbnail paths)
└── sort_order

-- Temporary uploads
temporary_uploads
├── token
├── user_id
├── path
├── disk
├── mime_type
├── size
├── completed
└── expires_at
```

#### API Endpoints

```
POST   /api/media/request-upload           # Get presigned upload URL
POST   /api/media/confirm-upload           # Process uploaded file
POST   /api/media/attach                   # Attach to model
GET    /api/media/{id}                     # Get media info
DELETE /api/media/{id}                     # Delete media
```

### 5. Additional Services

#### Search Service
- Full-text search using Laravel Scout
- Search across items, collections, and tags
- Faceted search with filters
- Search suggestions

#### Analytics Service
- Track user activity
- App usage statistics
- Custom event tracking
- Retention metrics

#### Export/Import Service
- Bulk data export (CSV, JSON)
- Data import with validation
- GDPR compliance exports

#### Notification Service
- In-app notifications
- Email notifications
- Push notifications (web/mobile)
- Notification preferences

#### Background Jobs
- Queue system with Laravel Horizon
- Scheduled tasks
- Retry logic
- Job monitoring

## Performance & Security

### Caching Strategy
- Redis for session storage
- Query result caching
- API response caching
- CDN for static assets

### Security Features
- Rate limiting per endpoint
- API authentication via Bearer tokens
- Input validation and sanitization
- SQL injection protection via Eloquent
- XSS protection
- CORS configuration
- Audit logging

### Scalability
- Horizontal scaling ready
- Database connection pooling
- Queue workers scaling
- WebSocket server clustering
- Load balancer compatible

## Migration from Supabase

### Data Migration
1. Export Supabase data via pg_dump
2. Transform schema to new structure
3. Import into Laravel migrations
4. Verify data integrity

### Authentication Migration
1. Export user data from Supabase
2. Rehash passwords during first login
3. Maintain user sessions
4. Update OAuth connections

### API Compatibility
- Maintain similar endpoint structure
- Transform responses to match frontend
- Gradual migration approach

## Development Setup

### Requirements
- PHP 8.2+
- PostgreSQL 14+
- Redis 6+
- Node.js 18+ (for Reverb)

### Installation
```bash
# Clone repository
git clone [repo-url]

# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Start services
php artisan serve
php artisan reverb:start
php artisan horizon
```

### Testing
```bash
# Run tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific test
php artisan test --filter=AuthenticationTest
```

## Deployment

### Production Requirements
- Load balancer with sticky sessions
- PostgreSQL with replication
- Redis cluster
- S3-compatible storage
- SSL certificates

### Deployment Process
1. Build assets: `npm run build`
2. Run migrations: `php artisan migrate --force`
3. Clear caches: `php artisan optimize`
4. Restart queue workers: `php artisan horizon:terminate`
5. Start WebSocket server: `php artisan reverb:start`

## Monitoring

### Health Checks
- `/health` - Basic health check
- `/health/database` - Database connectivity
- `/health/redis` - Redis connectivity
- `/health/storage` - Storage accessibility

### Metrics
- Laravel Telescope for debugging
- Laravel Pulse for performance monitoring
- Custom metrics via StatsD
- Error tracking via Sentry

## API Documentation

API documentation is auto-generated using Laravel OpenAPI and available at:
- Development: `http://localhost:8000/api/documentation`
- Production: `https://api.tiko.app/documentation`

## Future Enhancements

### Planned Features
1. GraphQL API alongside REST
2. Webhook system for integrations
3. Advanced analytics dashboard
4. Machine learning recommendations
5. Offline-first sync engine
6. End-to-end encryption option
7. Multi-tenancy support
8. Plugin system for extensibility

### Performance Optimizations
1. Implement Swoole/RoadRunner
2. Database query optimization
3. Implement CQRS pattern
4. Event sourcing for audit trail
5. Microservices architecture

This backend provides a solid foundation for Tiko's growth while maintaining flexibility and performance.