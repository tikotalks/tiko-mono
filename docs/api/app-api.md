# Tiko App API Contract

Status: Draft contract for `workers/app-api` and `packages/data` implementation.

This document defines the clean application-data API boundary for Tiko before app stores move away from legacy direct data access. It is intentionally explicit about ownership, public reads, and offline sync because those are the places where the old Supabase-shaped model could otherwise leak back into the rebuild.

## Purpose

`workers/app-api` is the Tiko-owned Worker for child-facing app data and settings. Browser apps call it through a future `@tiko/data` client. It owns data that belongs to a Tiko identity owner or is explicitly public/curated.

It does not own identity, media bytes, generated audio, content/CMS, translation management, or admin-only operations.

## Non-negotiable rules

- The Worker derives the effective owner from the validated identity session or device context.
- Clients never send authoritative `userId`, `ownerId`, `deviceId`, `createdBy`, or tenant-equivalent fields for protected mutations.
- Device-first sessions are valid owners. Apps must work before email recovery is attached.
- Claimed/recoverable users may cause data ownership to move from `device.id` to `user.id`, but that transition is a server-side identity/app-data concern, not a client assertion.
- Public and curated data must use explicit read semantics. A missing bearer token must never imply access to private data.
- Offline sync uses idempotent client-generated IDs and monotonic client change metadata, but server validation and ownership remain authoritative.
- D1 is the source of truth for relational app data. KV may cache read models only. R2 stores bytes, not app records.
- App stores must call product-specific endpoints or typed `@tiko/data` methods, not database-shaped generic table APIs.

## Runtime origins

Target public API origin:

- Production: `https://api.tikoapi.org/app/*` or an equivalent route owned by `workers/app-api`.
- Development: `https://dev.api.tikoapi.org/app/*` or a local Wrangler origin.

Identity remains separate:

- `https://id.tiko.mt/api/identity/*` is owned by `workers/identity-api`.
- `workers/app-api` validates bearer sessions against the identity contract or a trusted internal identity verifier.
- `workers/app-api` must not implement login, passwords, OAuth, OTP, magic-link creation, or device bootstrap.

## Authentication and owner resolution

Protected reads and all mutations require an Authorization header carrying the device-first bearer session token.

The Worker resolves an `AppOwner` before touching protected data:

```ts
interface AppOwner {
  ownerId: string
  source: 'device' | 'user'
  isClaimed: boolean
  userId: string
  deviceId: string
  sessionId: string
}
```

Resolution rule:

1. Validate the bearer session with the identity authority.
2. If the identity user is claimed/recoverable, use `user.id` as `ownerId`.
3. Otherwise use `device.id` as `ownerId`.
4. Attach `ownerId`, `source`, `userId`, `deviceId`, and `sessionId` to the request context.
5. Ignore or reject any client-submitted ownership fields on protected mutations.

This matches the `@tiko/identity` device-owner abstraction: anonymous/device-first data belongs to the stable device owner; recoverable data belongs to the claimed user owner.

## Shared protocol conventions

### IDs

Client-created records use idempotent IDs generated before sync:

- `card_<id>`
- `board_<id>`
- `sequence_<id>`
- `step_<id>`
- `todo_<id>`
- `task_<id>`
- `timer_<id>`
- `history_<id>`
- `setting_<id>` where a stable setting record is needed

The exact generator can change, but IDs must be globally unique enough for offline creation and retry-safe sync. The Worker accepts a repeated create/upsert with the same ID from the same resolved owner as idempotent.

### Timestamps

- Client sends `clientCreatedAt`, `clientUpdatedAt`, and optional `clientChangeId` for offline diagnostics and conflict handling.
- Server sets `createdAt`, `updatedAt`, and `deletedAt`.
- Server timestamps win in canonical responses.

### Soft delete

Mutable user data uses soft deletion for sync:

```ts
interface Tombstone {
  id: string
  deletedAt: string
  revision: number
}
```

List endpoints include `includeDeleted=true` only for sync clients. Normal app reads exclude deleted records.

### Revisions and conflicts

Mutable records expose a server `revision: number`.

- Create/upsert without `baseRevision` is allowed for offline-first idempotent creation.
- Update/delete with `baseRevision` protects against accidental overwrite.
- If `baseRevision` is stale, the Worker returns `409 conflict` with the current server record.
- Product stores may choose last-write-wins only where the app domain is genuinely harmless; that choice must be explicit in the endpoint notes.

### Error shape

All errors use one JSON shape:

```ts
interface AppApiError {
  error: {
    code: string
    message: string
    requestId: string
    details?: unknown
  }
}
```

Common codes:

- `unauthorized`
- `forbidden`
- `not_found`
- `validation_failed`
- `conflict`
- `rate_limited`
- `unsupported_app`
- `internal_error`

### Pagination

List endpoints support cursor pagination:

```ts
interface Page<T> {
  items: T[]
  nextCursor?: string
}
```

The cursor is opaque. Clients must not parse it.

## Public and curated read semantics

The API has three read classes:

1. `private`: bearer session required; returns only records owned by the resolved owner or explicitly shared to that owner.
2. `public`: no bearer required; returns records explicitly marked public by a trusted source. It never falls back to private data.
3. `curated`: no bearer required or optional bearer; returns platform-curated records managed by content/admin tooling, not user private records.

Endpoint paths must reveal the class:

- `/app/cards/boards` is private by default.
- `/app/cards/public/boards` is public.
- `/app/radio/curated/items` is curated.

A public or curated endpoint must not inspect client-submitted owner IDs.

## Sync protocol

Each product domain may expose high-level CRUD endpoints plus a sync endpoint.

Recommended sync request:

```ts
interface SyncRequest<TChange> {
  since?: string
  changes: TChange[]
  clientId: string
}
```

Recommended sync response:

```ts
interface SyncResponse<TRecord> {
  serverTime: string
  cursor: string
  applied: Array<{ id: string; revision: number }>
  conflicts: Array<{ id: string; server: TRecord; reason: string }>
  records: TRecord[]
  tombstones: Tombstone[]
}
```

Sync rules:

- The Worker resolves owner once per request and applies it to every change.
- A change may include a local `clientChangeId` for retry tracing.
- Replaying the same `clientChangeId` for the same owner should not duplicate side effects.
- Unknown IDs on update/delete return `not_found`, unless the change is an idempotent create/upsert.

## Domain contracts

### Cards: boards, cards, and items

Purpose: visual communication boards and cards, including personal boards and explicitly public/curated board templates.

Private endpoints:

- `GET /app/cards/boards?cursor=&includeDeleted=`
- `POST /app/cards/boards`
- `GET /app/cards/boards/:boardId`
- `PATCH /app/cards/boards/:boardId`
- `DELETE /app/cards/boards/:boardId`
- `GET /app/cards/boards/:boardId/items?cursor=&includeDeleted=`
- `PUT /app/cards/boards/:boardId/items/:itemId`
- `DELETE /app/cards/boards/:boardId/items/:itemId`
- `POST /app/cards/sync`

Public/curated endpoints:

- `GET /app/cards/public/boards?cursor=`
- `GET /app/cards/public/boards/:boardId`
- `GET /app/cards/curated/boards?locale=&cursor=`

Core record shapes:

```ts
interface CardBoard {
  id: string
  title: string
  description?: string
  visibility: 'private' | 'public' | 'curated'
  icon?: string
  color?: string
  revision: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

interface CardItem {
  id: string
  boardId: string
  label: string
  imageId?: string
  audioId?: string
  color?: string
  sortOrder: number
  revision: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

Ownership rules:

- Client mutations may include `boardId`, `itemId`, labels, order, and appearance fields.
- Worker attaches `ownerId` to private records.
- Public publishing is not a normal child-app mutation; it requires a protected parent/admin workflow not defined here.

### Sequences: sequences and steps

Purpose: ordered routines/stories/actions for communication and planning.

Endpoints:

- `GET /app/sequences?cursor=&includeDeleted=`
- `POST /app/sequences`
- `GET /app/sequences/:sequenceId`
- `PATCH /app/sequences/:sequenceId`
- `DELETE /app/sequences/:sequenceId`
- `GET /app/sequences/:sequenceId/steps?includeDeleted=`
- `PUT /app/sequences/:sequenceId/steps/:stepId`
- `DELETE /app/sequences/:sequenceId/steps/:stepId`
- `POST /app/sequences/sync`
- `GET /app/sequences/curated?locale=&cursor=`

Core shapes:

```ts
interface Sequence {
  id: string
  title: string
  description?: string
  color?: string
  icon?: string
  revision: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

interface SequenceStep {
  id: string
  sequenceId: string
  label: string
  imageId?: string
  audioId?: string
  sortOrder: number
  revision: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

### Todo: routines, tasks, and task steps

Purpose: simple task/routine lists where child-facing completion can be local-first but durable.

Endpoints:

- `GET /app/todo/tasks?cursor=&status=&includeDeleted=`
- `POST /app/todo/tasks`
- `GET /app/todo/tasks/:taskId`
- `PATCH /app/todo/tasks/:taskId`
- `DELETE /app/todo/tasks/:taskId`
- `PUT /app/todo/tasks/:taskId/steps/:stepId`
- `DELETE /app/todo/tasks/:taskId/steps/:stepId`
- `POST /app/todo/tasks/:taskId/complete`
- `POST /app/todo/sync`

Core shapes:

```ts
interface TodoTask {
  id: string
  title: string
  notes?: string
  status: 'open' | 'done' | 'archived'
  dueAt?: string
  repeatRule?: string
  revision: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

interface TodoStep {
  id: string
  taskId: string
  label: string
  done: boolean
  sortOrder: number
  revision: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

Completion rule:

- `POST /complete` records a server-side completion event and may update task status.
- Offline clients can sync completion changes with idempotent `clientChangeId`.

### Timer: settings and history

Purpose: timer preferences and local/history records useful across devices once claimed.

Endpoints:

- `GET /app/timer/settings`
- `PUT /app/timer/settings`
- `GET /app/timer/history?cursor=&from=&to=`
- `POST /app/timer/history`
- `DELETE /app/timer/history/:historyId`
- `POST /app/timer/sync`

Core shapes:

```ts
interface TimerSettings {
  defaultDurationSeconds: number
  warningAtSeconds?: number
  soundId?: string
  color?: string
  revision: number
  updatedAt: string
}

interface TimerHistoryEntry {
  id: string
  durationSeconds: number
  completed: boolean
  startedAt: string
  endedAt?: string
  revision: number
  createdAt: string
  deletedAt?: string
}
```

History policy:

- Timer history is private.
- Normal retention limits may be enforced server-side later, but retention must be documented before deletion becomes automatic.

### Yes/No: settings and answer history

Purpose: Yes/No app preferences and optional answer-history continuity.

Endpoints:

- `GET /app/yes-no/settings`
- `PUT /app/yes-no/settings`
- `GET /app/yes-no/history?cursor=&from=&to=`
- `POST /app/yes-no/history`
- `DELETE /app/yes-no/history/:historyId`
- `POST /app/yes-no/sync`

Core shapes:

```ts
interface YesNoSettings {
  yesLabel?: string
  noLabel?: string
  voiceEnabled: boolean
  colorMode?: string
  revision: number
  updatedAt: string
}

interface YesNoHistoryEntry {
  id: string
  answer: 'yes' | 'no'
  prompt?: string
  answeredAt: string
  revision: number
  createdAt: string
  deletedAt?: string
}
```

Privacy rule:

- Answer history is private and optional. The app must still function fully when history sync is disabled or offline.

### Type: settings and phrase history

Purpose: typing/phrase communication preferences and optional sent/spoken phrase history.

Endpoints:

- `GET /app/type/settings`
- `PUT /app/type/settings`
- `GET /app/type/history?cursor=&from=&to=`
- `POST /app/type/history`
- `DELETE /app/type/history/:historyId`
- `POST /app/type/sync`

Core shapes:

```ts
interface TypeSettings {
  voiceEnabled: boolean
  preferredVoiceId?: string
  textSize?: 'small' | 'medium' | 'large' | 'extra-large'
  revision: number
  updatedAt: string
}

interface TypeHistoryEntry {
  id: string
  text: string
  spoken: boolean
  spokenAt?: string
  revision: number
  createdAt: string
  deletedAt?: string
}
```

Sensitive data rule:

- Phrase history may contain personal communication. It is private, optional, and must support local-only use if the product later exposes that toggle.

### Radio: items, settings, and play history

Purpose: personal/curated audio items, radio preferences, and optional playback history.

Private endpoints:

- `GET /app/radio/items?cursor=&includeDeleted=`
- `POST /app/radio/items`
- `GET /app/radio/items/:itemId`
- `PATCH /app/radio/items/:itemId`
- `DELETE /app/radio/items/:itemId`
- `GET /app/radio/settings`
- `PUT /app/radio/settings`
- `GET /app/radio/play-history?cursor=&from=&to=`
- `POST /app/radio/play-history`
- `POST /app/radio/sync`

Curated endpoints:

- `GET /app/radio/curated/items?locale=&cursor=`
- `GET /app/radio/curated/items/:itemId`

Core shapes:

```ts
interface RadioItem {
  id: string
  title: string
  description?: string
  audioId: string
  imageId?: string
  source: 'user' | 'curated'
  revision: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

interface RadioSettings {
  autoplay: boolean
  shuffle: boolean
  preferredVolume?: number
  revision: number
  updatedAt: string
}

interface RadioPlayHistoryEntry {
  id: string
  itemId: string
  playedAt: string
  durationSeconds?: number
  completed?: boolean
  revision: number
  createdAt: string
  deletedAt?: string
}
```

Media boundary:

- `audioId` and `imageId` reference media records/bytes owned by media APIs. `workers/app-api` stores references and app metadata; it does not upload or serve raw bytes.

## Parent/admin-controlled actions

Some mutations are sensitive even if they touch app data:

- making a board public;
- importing curated templates into a user library;
- deleting all app data;
- exporting all private data;
- changing retention/history defaults for a child profile.

These require explicit parent/admin authorization semantics. They must not be hidden inside ordinary child-app CRUD endpoints.

## Future `@tiko/data` package boundary

`packages/data` should expose typed clients that match this contract without leaking HTTP details into app stores.

Suggested modules:

- `@tiko/data/cards`
- `@tiko/data/sequences`
- `@tiko/data/todo`
- `@tiko/data/timer`
- `@tiko/data/yes-no`
- `@tiko/data/type`
- `@tiko/data/radio`
- `@tiko/data/sync`

The package should accept an identity/session provider and an HTTP transport, then attach bearer auth internally. App stores should not manually assemble ownership fields.

## Future `workers/app-api` README requirements

When `workers/app-api` is created, its README must include:

- origin/routes;
- D1 binding and migration names;
- local development commands;
- test commands;
- auth verification strategy against `workers/identity-api`;
- endpoint list matching this document;
- explicit note that owner is derived server-side;
- public/curated/private read semantics;
- sync/idempotency behavior;
- deployment notes for dev and production routes.

## Doctrine checklist

A proposed implementation passes this contract only if:

- apps open immediately with device-first identity;
- the Worker derives owner from session/device and rejects client authority over ownership;
- all protected mutations validate bearer identity before writing;
- public and curated endpoints are separate from private endpoints by path and behavior;
- offline create/update/delete can be retried safely using client-generated IDs and `clientChangeId`;
- server `revision` and conflict responses exist for mutable records;
- app stores call typed data clients rather than storage/database primitives;
- no Supabase, Better Auth, password, OTP, OAuth, or login-wall assumptions are introduced;
- media, content, identity, generation, and admin concerns remain outside `workers/app-api`.
