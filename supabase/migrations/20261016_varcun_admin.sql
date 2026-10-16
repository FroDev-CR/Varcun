-- Isolated Varcun administration. No grants on other applications' tables.
begin;
do $$ begin
  if not exists (select from pg_roles where rolname = 'varcun_admin_backend') then
    create role varcun_admin_backend nologin;
  end if;
end $$;
grant varcun_admin_backend to authenticator;
grant usage on schema public to varcun_admin_backend;

alter table public.varcun_quote_requests add column if not exists status text not null default 'nueva' check (status in ('nueva','en_revision','respondida','cerrada'));
alter table public.varcun_quote_requests add column if not exists internal_notes text not null default '' check (char_length(internal_notes) <= 4000);
alter table public.varcun_quote_requests add column if not exists updated_at timestamptz not null default now();
create index if not exists varcun_quotes_created_idx on public.varcun_quote_requests(created_at desc,id);
create index if not exists varcun_quotes_status_idx on public.varcun_quote_requests(status);
grant select on public.varcun_quote_requests to varcun_admin_backend;
grant update(status,internal_notes,updated_at) on public.varcun_quote_requests to varcun_admin_backend;
drop policy if exists varcun_admin_read_quotes on public.varcun_quote_requests;
create policy varcun_admin_read_quotes on public.varcun_quote_requests for select to varcun_admin_backend using (true);
drop policy if exists varcun_admin_update_quotes on public.varcun_quote_requests;
create policy varcun_admin_update_quotes on public.varcun_quote_requests for update to varcun_admin_backend using (true) with check (true);

create table if not exists public.varcun_admin_accounts (
  id boolean primary key default true check(id),
  email text not null check(char_length(email) <= 254),
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.varcun_admin_bootstrap (
  id boolean primary key default true check(id),
  token_hash text not null check(token_hash ~ '^[a-f0-9]{64}$'),
  email text,
  expires_at timestamptz not null,
  purpose text not null default 'setup' check(purpose in ('setup','reset'))
);
create table if not exists public.varcun_admin_sessions (
  token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
  credential_version text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists varcun_admin_session_expiry_idx on public.varcun_admin_sessions(expires_at);
create table if not exists public.varcun_site_content (
  id boolean primary key default true check(id),
  data jsonb not null default '{}' check(jsonb_typeof(data)='object'),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
insert into public.varcun_site_content(id) values(true) on conflict do nothing;
create table if not exists public.varcun_content_revisions (
  id uuid primary key default gen_random_uuid(),
  version integer not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  actor text not null
);
alter table public.varcun_admin_accounts enable row level security;
alter table public.varcun_admin_bootstrap enable row level security;
alter table public.varcun_admin_sessions enable row level security;
alter table public.varcun_site_content enable row level security;
alter table public.varcun_content_revisions enable row level security;
revoke all on public.varcun_admin_accounts,public.varcun_admin_bootstrap,public.varcun_admin_sessions,public.varcun_site_content,public.varcun_content_revisions from public,anon,authenticated;
grant select,update(password_hash) on public.varcun_admin_accounts to varcun_admin_backend;
grant select,insert,delete on public.varcun_admin_sessions to varcun_admin_backend;
grant select on public.varcun_site_content,public.varcun_content_revisions to varcun_admin_backend;
grant select on public.varcun_site_content to anon;
drop policy if exists varcun_admin_account_access on public.varcun_admin_accounts;
create policy varcun_admin_account_access on public.varcun_admin_accounts to varcun_admin_backend using(true) with check(true);
drop policy if exists varcun_admin_session_access on public.varcun_admin_sessions;
create policy varcun_admin_session_access on public.varcun_admin_sessions to varcun_admin_backend using(true) with check(true);
drop policy if exists varcun_content_public_read on public.varcun_site_content;
create policy varcun_content_public_read on public.varcun_site_content for select to anon,varcun_admin_backend using(true);
drop policy if exists varcun_content_history_read on public.varcun_content_revisions;
create policy varcun_content_history_read on public.varcun_content_revisions for select to varcun_admin_backend using(true);

create or replace function public.varcun_admin_activate(p_email text,p_password_hash text,p_token_hash text) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare activation public.varcun_admin_bootstrap%rowtype;
begin
  select * into activation from public.varcun_admin_bootstrap where id=true for update;
  if not found or p_email is null or p_password_hash is null or p_token_hash is null or activation.expires_at<=now() or activation.token_hash<>p_token_hash or (activation.email is not null and activation.email<>lower(p_email)) then
    raise exception 'Invalid activation' using errcode='28000';
  end if;
  if p_password_hash !~ '^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$' or char_length(p_email)>254 then
    raise exception 'Invalid account' using errcode='22023';
  end if;
  if activation.purpose='setup' then
    if exists(select from public.varcun_admin_accounts) then raise exception 'Already activated' using errcode='28000'; end if;
    insert into public.varcun_admin_accounts(id,email,password_hash) values(true,lower(p_email),p_password_hash);
  else
    update public.varcun_admin_accounts set password_hash=p_password_hash where id=true and email=lower(p_email);
    if not found then raise exception 'Invalid recovery' using errcode='28000'; end if;
  end if;
  delete from public.varcun_admin_bootstrap where id=true;
  delete from public.varcun_admin_sessions;
end $$;
revoke all on function public.varcun_admin_activate(text,text,text) from public,anon,authenticated;
grant execute on function public.varcun_admin_activate(text,text,text) to varcun_admin_backend;

create or replace function public.varcun_admin_publish_content(p_data jsonb,p_expected_version integer,p_actor text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare current_content public.varcun_site_content%rowtype;
begin
  select * into current_content from public.varcun_site_content where id=true for update;
  if p_expected_version is null or current_content.version<>p_expected_version then raise exception 'Content changed' using errcode='40001'; end if;
  if p_data is null or p_actor is null or jsonb_typeof(p_data)<>'object' or pg_column_size(p_data)>24576 then raise exception 'Invalid content' using errcode='22023'; end if;
  insert into public.varcun_content_revisions(version,data,actor) values(current_content.version,current_content.data,p_actor);
  update public.varcun_site_content set data=p_data,version=version+1,updated_at=now() where id=true returning * into current_content;
  return jsonb_build_object('data',current_content.data,'version',current_content.version,'updated_at',current_content.updated_at);
end $$;
revoke all on function public.varcun_admin_publish_content(jsonb,integer,text) from public,anon,authenticated;
grant execute on function public.varcun_admin_publish_content(jsonb,integer,text) to varcun_admin_backend;

create or replace function public.varcun_admin_inbox(p_search text default '',p_status text default 'todas',p_page integer default 0) returns jsonb
language sql stable security invoker set search_path=pg_catalog,public as $$
  with filtered as (
    select id,created_at,name,company,category,quantity,status from public.varcun_quote_requests
    where (p_status='todas' or status=p_status)
      and (p_search='' or strpos(lower(concat_ws(' ',name,email,company)),lower(p_search))>0)
  ), page_rows as (
    select * from filtered order by created_at desc,id limit 20 offset greatest(0,least(p_page,100000))*20
  )
  select jsonb_build_object('quotes',coalesce((select jsonb_agg(row_to_json(page_rows)) from page_rows),'[]'::jsonb),
    'total',(select count(*) from filtered),
    'counts',(select jsonb_object_agg(status,total) from (select status,count(*) as total from public.varcun_quote_requests group by status) counts));
$$;
revoke all on function public.varcun_admin_inbox(text,text,integer) from public,anon,authenticated;
grant execute on function public.varcun_admin_inbox(text,text,integer) to varcun_admin_backend;
notify pgrst,'reload schema';
commit;
