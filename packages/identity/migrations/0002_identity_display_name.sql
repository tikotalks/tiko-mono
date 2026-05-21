-- Preserve anonymous device users while allowing email + name to claim/convert them.

alter table users add column display_name text;
alter table magic_links add column display_name text;
