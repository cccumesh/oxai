-- Pilot: naya plant account sirf invite key se.
-- Supabase SQL Editor mein YE file Run karo (ek baar).

create table if not exists sa_signup_keys (
  code text primary key,
  note text default '',
  used_at timestamptz,
  used_by_org uuid references sa_orgs(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table sa_signup_keys enable row level security;

revoke all on sa_signup_keys from anon, authenticated, public;

-- Purana 3-arg signup hatao
drop function if exists sa_signup_org(text, text, text);

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

revoke all on function sa_signup_org(text, text, text, text) from public;
grant execute on function sa_signup_org(text, text, text, text) to anon, authenticated;

-- 12 pilot keys (ek baar use — phir burn)
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
