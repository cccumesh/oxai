-- ============================================================
-- SANJAY AQUA — POORI SQL (ek hi baar, poora block Run)
-- Project tables: sirf sa_*  |  purana data DELETE nahi hota
-- ============================================================

-- 1) Tables
create table if not exists sa_devices (
  id uuid primary key,
  role text not null check (role in ('driver', 'owner')),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists sa_customers (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references sa_devices(id) on delete cascade,
  name text not null,
  place text default '',
  usual_jars int not null default 1,
  sequence int not null default 0,
  pending_jars int not null default 0,
  jar_rate numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists sa_deliveries (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references sa_devices(id) on delete cascade,
  customer_id uuid not null references sa_customers(id) on delete cascade,
  work_date date not null,
  jars_given int not null default 0,
  empty_collected int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'complete')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (device_id, customer_id, work_date)
);

create table if not exists sa_day_trips (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references sa_devices(id) on delete cascade,
  work_date date not null,
  filled_out int not null default 0,
  filled_back int not null default 0,
  waste_jars int not null default 0,
  leak_jars int not null default 0,
  broke_jars int not null default 0,
  rokda_jars int not null default 0,
  returned_jars int not null default 0,
  unique (device_id, work_date)
);

-- Payment / udhari (paisa). Jar pending alag cheez hai.
create table if not exists sa_payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references sa_customers(id) on delete cascade,
  amount numeric not null default 0,
  for_month text not null default '',
  paid_on date not null default current_date,
  note text default '',
  created_at timestamptz not null default now()
);

create extension if not exists pgcrypto with schema extensions;

create table if not exists sa_orgs (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  firm_name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- 2) Purani table par missing columns (data safe)
alter table sa_customers add column if not exists place text default '';
alter table sa_customers add column if not exists jar_rate numeric not null default 0;
alter table sa_day_trips add column if not exists filled_out int not null default 0;
alter table sa_day_trips add column if not exists filled_back int not null default 0;
alter table sa_day_trips add column if not exists waste_jars int not null default 0;
alter table sa_day_trips add column if not exists leak_jars int not null default 0;
alter table sa_day_trips add column if not exists broke_jars int not null default 0;
alter table sa_day_trips add column if not exists rokda_jars int not null default 0;
alter table sa_day_trips add column if not exists returned_jars int not null default 0;
alter table sa_devices add column if not exists org_id uuid references sa_orgs(id) on delete cascade;
alter table sa_devices add column if not exists login_key text default '';
alter table sa_customers add column if not exists org_id uuid references sa_orgs(id) on delete cascade;
alter table sa_deliveries add column if not exists org_id uuid references sa_orgs(id) on delete cascade;
alter table sa_day_trips add column if not exists org_id uuid references sa_orgs(id) on delete cascade;
alter table sa_payments add column if not exists org_id uuid references sa_orgs(id) on delete cascade;

create table if not exists sa_sessions (
  token_hash bytea primary key,
  org_id uuid not null references sa_orgs(id) on delete cascade,
  device_id uuid references sa_devices(id) on delete cascade,
  role text not null check (role in ('driver', 'owner')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 3) Indexes
create index if not exists sa_customers_device_seq on sa_customers (device_id, sequence);
create index if not exists sa_deliveries_date on sa_deliveries (work_date);
create index if not exists sa_deliveries_device_date on sa_deliveries (device_id, work_date);
create index if not exists sa_day_trips_date on sa_day_trips (work_date);
create index if not exists sa_payments_customer on sa_payments (customer_id);
create unique index if not exists sa_orgs_username on sa_orgs (username);
create index if not exists sa_devices_org on sa_devices (org_id);
create index if not exists sa_customers_org on sa_customers (org_id);
create index if not exists sa_deliveries_org_date on sa_deliveries (org_id, work_date);
create index if not exists sa_day_trips_org_date on sa_day_trips (org_id, work_date);
create index if not exists sa_payments_org on sa_payments (org_id);
create index if not exists sa_sessions_org on sa_sessions (org_id);

create table if not exists sa_login_guard (
  username text primary key,
  fails int not null default 0,
  wait_sec int not null default 30,
  lock_until timestamptz,
  unlocked_at timestamptz,
  hot boolean not null default false
);

-- Pilot: naya plant sirf invite key se
create table if not exists sa_signup_keys (
  code text primary key,
  note text default '',
  used_at timestamptz,
  used_by_org uuid references sa_orgs(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 4) Security (har plant ka data alag)
alter table sa_devices enable row level security;
alter table sa_customers enable row level security;
alter table sa_deliveries enable row level security;
alter table sa_day_trips enable row level security;
alter table sa_payments enable row level security;
alter table sa_sessions enable row level security;
alter table sa_orgs enable row level security;
alter table sa_login_guard enable row level security;
alter table sa_signup_keys enable row level security;

drop policy if exists sa_devices_all on sa_devices;
drop policy if exists sa_customers_all on sa_customers;
drop policy if exists sa_deliveries_all on sa_deliveries;
drop policy if exists sa_day_trips_all on sa_day_trips;
drop policy if exists sa_payments_all on sa_payments;
drop policy if exists sa_orgs_all on sa_orgs;
drop policy if exists sa_devices_select on sa_devices;
drop policy if exists sa_devices_insert on sa_devices;
drop policy if exists sa_devices_update on sa_devices;
drop policy if exists sa_devices_delete on sa_devices;
drop policy if exists sa_customers_select on sa_customers;
drop policy if exists sa_customers_write on sa_customers;
drop policy if exists sa_customers_insert on sa_customers;
drop policy if exists sa_customers_update on sa_customers;
drop policy if exists sa_deliveries_select on sa_deliveries;
drop policy if exists sa_deliveries_write on sa_deliveries;
drop policy if exists sa_deliveries_insert on sa_deliveries;
drop policy if exists sa_deliveries_update on sa_deliveries;
drop policy if exists sa_deliveries_delete on sa_deliveries;
drop policy if exists sa_day_trips_select on sa_day_trips;
drop policy if exists sa_day_trips_write on sa_day_trips;
drop policy if exists sa_day_trips_insert on sa_day_trips;
drop policy if exists sa_day_trips_update on sa_day_trips;
drop policy if exists sa_day_trips_delete on sa_day_trips;
drop policy if exists sa_payments_owner on sa_payments;

revoke all on sa_orgs from anon, authenticated, public;
revoke all on sa_sessions from anon, authenticated, public;
revoke all on sa_login_guard from anon, authenticated, public;
revoke all on sa_signup_keys from anon, authenticated, public;

create or replace function sa_norm_user(p text)
returns text language sql immutable as $$
  select regexp_replace(lower(trim(coalesce(p, ''))), '[^a-z0-9._]', '', 'g');
$$;

create or replace function sa_request_token()
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  h json;
  info text;
  tok text;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then
    return '';
  end;
  tok := trim(coalesce(h->>'x-sa-session', ''));
  if length(tok) >= 32 then return tok; end if;
  info := coalesce(h->>'x-client-info', '');
  if info like 'sa-session %' then
    return trim(substr(info, 12));
  end if;
  return '';
end;
$$;

create or replace function sa_issue_session(p_org uuid, p_device uuid, p_role text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
begin
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into sa_sessions (token_hash, org_id, device_id, role, expires_at)
  values (
    extensions.digest(v_token, 'sha256'),
    p_org,
    p_device,
    p_role,
    now() + interval '400 days'
  );
  return v_token;
end;
$$;

create or replace function sa_auth_org()
returns uuid
language sql
stable
security definer
set search_path = public, extensions
as $$
  select s.org_id
  from sa_sessions s
  where s.token_hash = extensions.digest(sa_request_token(), 'sha256')
    and s.expires_at > now()
  limit 1;
$$;

create or replace function sa_auth_role()
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select s.role
  from sa_sessions s
  where s.token_hash = extensions.digest(sa_request_token(), 'sha256')
    and s.expires_at > now()
  limit 1;
$$;

create or replace function sa_auth_device()
returns uuid
language sql
stable
security definer
set search_path = public, extensions
as $$
  select s.device_id
  from sa_sessions s
  where s.token_hash = extensions.digest(sa_request_token(), 'sha256')
    and s.expires_at > now()
  limit 1;
$$;

create or replace function sa_can_org(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p_org is not null and p_org = sa_auth_org();
$$;

create or replace function sa_can_device(p_org uuid, p_device uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select sa_can_org(p_org) and (
    sa_auth_role() = 'owner'
    or p_device = sa_auth_device()
  );
$$;

create or replace function sa_india_today()
returns date
language sql
stable
as $$
  select (timezone('Asia/Kolkata', now()))::date;
$$;

create or replace function sa_driver_can_edit_date(p_date date)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select sa_auth_role() = 'owner'
    or (p_date is not null and p_date >= sa_india_today() - 2);
$$;

create or replace function sa_username_taken(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists(select 1 from sa_orgs where username = sa_norm_user(p_username));
$$;

create or replace function sa_claim_org_data(p_org uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if exists (select 1 from sa_devices where org_id is not null) then
    return;
  end if;
  update sa_devices set org_id = p_org where org_id is null;
  update sa_customers c set org_id = d.org_id from sa_devices d where c.device_id = d.id and c.org_id is null;
  update sa_deliveries x set org_id = d.org_id from sa_devices d where x.device_id = d.id and x.org_id is null;
  update sa_day_trips x set org_id = d.org_id from sa_devices d where x.device_id = d.id and x.org_id is null;
  update sa_payments p set org_id = c.org_id from sa_customers c where p.customer_id = c.id and p.org_id is null;
end;
$$;

drop function if exists sa_signup_org(text, text, text);
drop function if exists sa_signup_org(text, text, text, text);

create or replace function sa_login_wait(p_user text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  g sa_login_guard%rowtype;
  v_left int;
begin
  select * into g from sa_login_guard where username = p_user;
  if found and g.lock_until is not null and g.lock_until > now() then
    v_left := greatest(1, ceil(extract(epoch from g.lock_until - now()))::int);
    raise exception 'Ruko, % second baad try karo.', v_left;
  end if;
end;
$$;

create or replace function sa_login_fail(p_user text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  g sa_login_guard%rowtype;
  v_wait int;
begin
  perform sa_login_wait(p_user);
  insert into sa_login_guard (username, fails, wait_sec, hot)
  values (p_user, 0, 30, false)
  on conflict (username) do nothing;
  select * into g from sa_login_guard where username = p_user;
  if g.fails = 0 then
    if g.unlocked_at is not null and now() <= g.unlocked_at + interval '30 seconds' then
      g.hot := true;
    else
      g.hot := false;
      g.wait_sec := 30;
    end if;
  end if;
  g.fails := g.fails + 1;
  if g.fails < 4 then
    update sa_login_guard
      set fails = g.fails, wait_sec = g.wait_sec, hot = g.hot
    where username = p_user;
    return;
  end if;
  v_wait := case when g.hot then least(g.wait_sec + 30, 600) else 30 end;
  update sa_login_guard
    set fails = 0,
        wait_sec = v_wait,
        hot = false,
        lock_until = now() + make_interval(secs => v_wait),
        unlocked_at = now() + make_interval(secs => v_wait)
  where username = p_user;
  raise exception '4 galat try. % second baad try karo.', v_wait;
end;
$$;

create or replace function sa_login_ok(p_user text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from sa_login_guard where username = p_user;
end;
$$;

create or replace function sa_signup_org(p_username text, p_firm text, p_password text, p_invite text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user text;
  v_firm text;
  v_invite text;
  v_id uuid;
  v_key text;
begin
  v_user := sa_norm_user(p_username);
  v_firm := trim(coalesce(p_firm, ''));
  v_invite := upper(trim(coalesce(p_invite, '')));
  v_invite := regexp_replace(v_invite, '[^A-Z0-9\-]', '', 'g');

  if length(v_invite) < 6 then raise exception 'Invite key likho'; end if;
  if length(v_user) < 3 then raise exception 'Username kam se kam 3 letters'; end if;
  if length(v_firm) < 2 then raise exception 'Firm ka naam likho'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'Password kam se kam 6 letters'; end if;
  if exists(select 1 from sa_orgs where username = v_user) then
    raise exception 'Username already taken';
  end if;

  select code into v_key
  from sa_signup_keys
  where code = v_invite and used_at is null
  for update;

  if v_key is null then
    raise exception 'Invite key galat ya use ho chuki';
  end if;

  insert into sa_orgs (username, firm_name, password_hash)
  values (v_user, v_firm, extensions.crypt(p_password, extensions.gen_salt('bf'::text)))
  returning id into v_id;

  update sa_signup_keys
  set used_at = now(), used_by_org = v_id
  where code = v_key;

  perform sa_claim_org_data(v_id);
  return json_build_object(
    'org_id', v_id,
    'username', v_user,
    'firm_name', v_firm,
    'session_token', sa_issue_session(v_id, null, 'owner')
  );
end;
$$;

create or replace function sa_login_org(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r sa_orgs%rowtype;
  v_user text;
  v_key text;
begin
  v_user := sa_norm_user(p_username);
  v_key := 'owner:' || v_user;
  perform sa_login_wait(v_key);
  select * into r from sa_orgs where username = v_user;
  if not found or r.password_hash is distinct from extensions.crypt(p_password, r.password_hash) then
    perform sa_login_fail(v_key);
    raise exception 'Username ya password galat';
  end if;
  perform sa_login_ok(v_key);
  return json_build_object(
    'org_id', r.id,
    'username', r.username,
    'firm_name', r.firm_name,
    'session_token', sa_issue_session(r.id, null, 'owner')
  );
end;
$$;

create or replace function sa_login_driver(p_username text, p_key text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_org sa_orgs%rowtype;
  v_dev sa_devices%rowtype;
  v_user text;
  v_guard text;
  v_key text;
begin
  v_user := sa_norm_user(p_username);
  v_guard := 'driver:' || v_user;
  perform sa_login_wait(v_guard);
  select * into v_org from sa_orgs where username = v_user;
  v_key := upper(trim(replace(coalesce(p_key, ''), ' ', '')));
  v_key := replace(v_key, '-', '');
  if found then
    select * into v_dev
    from sa_devices
    where org_id = v_org.id
      and role = 'driver'
      and replace(upper(coalesce(login_key, '')), '-', '') = v_key
    limit 1;
  end if;
  if v_org.id is null or v_dev.id is null then
    perform sa_login_fail(v_guard);
    raise exception 'Company username ya key galat';
  end if;
  perform sa_login_ok(v_guard);
  return json_build_object(
    'org_id', v_org.id,
    'username', v_org.username,
    'firm_name', v_org.firm_name,
    'device_id', v_dev.id,
    'driver_name', v_dev.name,
    'session_token', sa_issue_session(v_org.id, v_dev.id, 'driver')
  );
end;
$$;

create or replace function sa_logout()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from sa_sessions
  where token_hash = extensions.digest(sa_request_token(), 'sha256');
  return json_build_object('ok', true);
end;
$$;

create or replace function sa_whoami()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s sa_sessions%rowtype;
  o sa_orgs%rowtype;
begin
  select * into s
  from sa_sessions
  where token_hash = extensions.digest(sa_request_token(), 'sha256')
    and expires_at > now()
  limit 1;
  if not found then raise exception 'Session khatam'; end if;
  select * into o from sa_orgs where id = s.org_id;
  return json_build_object(
    'org_id', s.org_id,
    'role', s.role,
    'device_id', s.device_id,
    'username', o.username,
    'firm_name', o.firm_name
  );
end;
$$;

create or replace function sa_bind_device(p_device uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s sa_sessions%rowtype;
  d sa_devices%rowtype;
begin
  select * into s
  from sa_sessions
  where token_hash = extensions.digest(sa_request_token(), 'sha256')
    and expires_at > now()
  limit 1;
  if not found then raise exception 'Session khatam'; end if;
  select * into d from sa_devices where id = p_device and org_id = s.org_id;
  if not found then raise exception 'Device galat'; end if;
  if s.role = 'driver' and d.id is distinct from s.device_id then
    raise exception 'Device galat';
  end if;
  update sa_sessions set device_id = d.id where token_hash = s.token_hash;
  return json_build_object('ok', true, 'device_id', d.id);
end;
$$;

revoke all on function sa_username_taken(text) from public;
revoke all on function sa_signup_org(text, text, text, text) from public;
revoke all on function sa_login_org(text, text) from public;
revoke all on function sa_login_driver(text, text) from public;
revoke all on function sa_logout() from public;
revoke all on function sa_whoami() from public;
revoke all on function sa_bind_device(uuid) from public;
revoke all on function sa_issue_session(uuid, uuid, text) from public;
grant execute on function sa_username_taken(text) to anon, authenticated;
grant execute on function sa_signup_org(text, text, text, text) to anon, authenticated;
grant execute on function sa_login_org(text, text) to anon, authenticated;
grant execute on function sa_login_driver(text, text) to anon, authenticated;
grant execute on function sa_logout() to anon, authenticated;
grant execute on function sa_whoami() to anon, authenticated;
grant execute on function sa_bind_device(uuid) to anon, authenticated;
grant execute on function sa_auth_org() to anon, authenticated;
grant execute on function sa_auth_role() to anon, authenticated;
grant execute on function sa_auth_device() to anon, authenticated;
grant execute on function sa_can_org(uuid) to anon, authenticated;
grant execute on function sa_can_device(uuid, uuid) to anon, authenticated;
grant execute on function sa_request_token() to anon, authenticated;
grant execute on function sa_india_today() to anon, authenticated;
grant execute on function sa_driver_can_edit_date(date) to anon, authenticated;

create policy sa_devices_select on sa_devices
  for select using (sa_can_device(org_id, id));
create policy sa_devices_insert on sa_devices
  for insert with check (sa_can_org(org_id) and sa_auth_role() = 'owner');
create policy sa_devices_update on sa_devices
  for update using (sa_can_device(org_id, id))
  with check (sa_can_org(org_id) and (sa_auth_role() = 'owner' or (id = sa_auth_device() and role = 'driver')));
create policy sa_devices_delete on sa_devices
  for delete using (sa_can_org(org_id) and sa_auth_role() = 'owner');

create policy sa_customers_select on sa_customers
  for select using (sa_can_device(org_id, device_id));
create policy sa_customers_insert on sa_customers
  for insert with check (sa_can_device(org_id, device_id));
create policy sa_customers_update on sa_customers
  for update using (sa_can_device(org_id, device_id))
  with check (sa_can_device(org_id, device_id));

create policy sa_deliveries_select on sa_deliveries
  for select using (sa_can_device(org_id, device_id));
create policy sa_deliveries_insert on sa_deliveries
  for insert with check (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date));
create policy sa_deliveries_update on sa_deliveries
  for update using (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date))
  with check (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date));
create policy sa_deliveries_delete on sa_deliveries
  for delete using (false);

create policy sa_day_trips_select on sa_day_trips
  for select using (sa_can_device(org_id, device_id));
create policy sa_day_trips_insert on sa_day_trips
  for insert with check (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date));
create policy sa_day_trips_update on sa_day_trips
  for update using (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date))
  with check (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date));
create policy sa_day_trips_delete on sa_day_trips
  for delete using (false);

create policy sa_payments_owner on sa_payments
  for all using (sa_can_org(org_id) and sa_auth_role() = 'owner')
  with check (sa_can_org(org_id) and sa_auth_role() = 'owner');

-- 5) Owner dashboard live (driver ke numbers turant)
do $$
begin
  begin alter publication supabase_realtime add table sa_devices; exception when others then null; end;
  begin alter publication supabase_realtime add table sa_customers; exception when others then null; end;
  begin alter publication supabase_realtime add table sa_deliveries; exception when others then null; end;
  begin alter publication supabase_realtime add table sa_day_trips; exception when others then null; end;
  begin alter publication supabase_realtime add table sa_payments; exception when others then null; end;
end $$;

-- 6) App ko naye columns dikhein
notify pgrst, 'reload schema';

-- 7) Pilot invite keys (fresh install). Live DB: signup_keys_pilot.sql Run karo.
insert into sa_signup_keys (code, note) values
  ('AJ-7K2M-9P4Q', 'pilot-01'),
  ('AJ-3H8R-5N6T', 'pilot-02'),
  ('AJ-2W9X-4C7V', 'pilot-03'),
  ('AJ-6Y1B-8M3K', 'pilot-04'),
  ('AJ-9D4F-2G7H', 'pilot-05'),
  ('AJ-5J8L-1Q6W', 'pilot-06'),
  ('AJ-4Z7A-3E9R', 'pilot-07'),
  ('AJ-8S2D-6F1G', 'pilot-08'),
  ('AJ-1K5M-7N4P', 'pilot-09'),
  ('AJ-9T3V-2X8Y', 'pilot-10'),
  ('AJ-6B4C-5H7J', 'pilot-11'),
  ('AJ-3L9N-8P1Q', 'pilot-12')
on conflict (code) do nothing;
