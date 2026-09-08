-- Sanjay Aqua only. Run this once.
-- Cap khul gayi / pani gira, aur jar toot gaya.

alter table sa_day_trips
  add column if not exists leak_jars int not null default 0;

alter table sa_day_trips
  add column if not exists broke_jars int not null default 0;
