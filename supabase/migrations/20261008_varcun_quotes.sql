-- Additive, isolated table. Existing application tables and policies are untouched.
begin;
do $$ begin
  if not exists (select from pg_roles where rolname = 'varcun_quote_writer') then
    create role varcun_quote_writer nologin;
  end if;
end $$;
grant varcun_quote_writer to authenticator;
grant usage on schema public to varcun_quote_writer;
create table if not exists public.varcun_quote_requests (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 30),
  company text check (char_length(company) <= 120),
  category text not null,
  quantity integer not null check (quantity between 1 and 1000000),
  message text not null check (char_length(message) between 10 and 4000),
  product_codes text[] not null default '{}',
  consent boolean not null check (consent = true)
);
alter table public.varcun_quote_requests enable row level security;
revoke all on public.varcun_quote_requests from public, anon, authenticated;
grant insert on public.varcun_quote_requests to varcun_quote_writer;
drop policy if exists varcun_server_insert on public.varcun_quote_requests;
create policy varcun_server_insert on public.varcun_quote_requests for insert to varcun_quote_writer with check (true);
grant all on public.varcun_quote_requests to service_role;
notify pgrst, 'reload schema';
commit;
