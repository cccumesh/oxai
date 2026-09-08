-- Sanjay Aqua only. Run this once. Does not touch old tables.

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
