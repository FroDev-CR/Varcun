-- PostgREST enables safe-update checks: session revocation needs a WHERE clause.
begin;

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
  -- Every session has a nonempty SHA-256 token hash; this revokes all sessions
  -- while retaining the database's protection against unfiltered mutations.
  delete from public.varcun_admin_sessions where token_hash<>'';
end $$;
revoke all on function public.varcun_admin_activate(text,text,text) from public,anon,authenticated;
grant execute on function public.varcun_admin_activate(text,text,text) to varcun_admin_backend;
notify pgrst,'reload schema';
commit;
