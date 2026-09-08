-- Sanjay Aqua only. Does not touch any existing tables.

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

alter table sa_customers add column if not exists jar_rate numeric not null default 0;

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

create index if not exists sa_customers_device_seq on sa_customers (device_id, sequence);
create index if not exists sa_deliveries_date on sa_deliveries (work_date);
create index if not exists sa_deliveries_device_date on sa_deliveries (device_id, work_date);

alter table sa_devices enable row level security;
alter table sa_customers enable row level security;
alter table sa_deliveries enable row level security;

drop policy if exists sa_devices_all on sa_devices;
drop policy if exists sa_customers_all on sa_customers;
drop policy if exists sa_deliveries_all on sa_deliveries;

create policy sa_devices_all on sa_devices for all using (true) with check (true);
create policy sa_customers_all on sa_customers for all using (true) with check (true);
create policy sa_deliveries_all on sa_deliveries for all using (true) with check (true);

-- Plant checkout: bhare leke gaye / bhare bache (per driver per day)
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

create index if not exists sa_day_trips_date on sa_day_trips (work_date);

alter table sa_day_trips enable row level security;
drop policy if exists sa_day_trips_all on sa_day_trips;
create policy sa_day_trips_all on sa_day_trips for all using (true) with check (true);
