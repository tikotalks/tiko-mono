-- Tiko device-first identity platform.
-- D1 is canonical. KV may cache active sessions but is never source of truth.

create table if not exists users (
  id text primary key,
  primary_email text unique,
  display_name text,
  created_at text not null,
  updated_at text not null,
  last_seen_at text
);

create table if not exists devices (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  app_id text not null,
  device_key_hash text,
  fingerprint_hash text not null,
  display_name text,
  trusted integer not null default 0 check (trusted in (0, 1)),
  created_at text not null,
  updated_at text not null,
  last_seen_at text
);

create unique index if not exists idx_devices_app_device_key on devices(app_id, device_key_hash) where device_key_hash is not null;
create index if not exists idx_devices_app_fingerprint on devices(app_id, fingerprint_hash);
create index if not exists idx_devices_user_id on devices(user_id);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  device_id text not null references devices(id) on delete cascade,
  token_hash text not null unique,
  state text not null default 'active' check (state in ('active', 'revoked', 'expired')),
  created_at text not null,
  updated_at text not null,
  expires_at text not null,
  revoked_at text,
  last_seen_at text
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_device_id on sessions(device_id);
create index if not exists idx_sessions_active_token on sessions(token_hash, state, expires_at);

create table if not exists email_tokens (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  purpose text not null check (purpose in ('recovery', 'transfer', 'verify_email')),
  created_at text not null,
  expires_at text not null,
  consumed_at text
);

create index if not exists idx_email_tokens_email on email_tokens(email);
create index if not exists idx_email_tokens_user_id on email_tokens(user_id);
create index if not exists idx_email_tokens_active on email_tokens(token_hash, expires_at) where consumed_at is null;

create table if not exists magic_links (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  state text not null default 'pending' check (state in ('pending', 'consumed', 'expired')),
  created_at text not null,
  expires_at text not null,
  consumed_at text,
  redirect_url text,
  display_name text
);

create index if not exists idx_magic_links_user_id on magic_links(user_id);
create index if not exists idx_magic_links_email on magic_links(email);
create index if not exists idx_magic_links_pending_token on magic_links(token_hash, state, expires_at) where consumed_at is null;
