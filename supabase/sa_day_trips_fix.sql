-- Sanjay Aqua only. Project: axerai-love / hdhqircgfluximypmdpu
-- SQL Editor mein yeh POORA block ek saath Run karo.

alter table sa_day_trips add column if not exists waste_jars int not null default 0;
alter table sa_day_trips add column if not exists leak_jars int not null default 0;
alter table sa_day_trips add column if not exists broke_jars int not null default 0;
alter table sa_day_trips add column if not exists rokda_jars int not null default 0;
alter table sa_day_trips add column if not exists returned_jars int not null default 0;

-- PostgREST ko naya column dikhane ke liye zaroori:
notify pgrst, 'reload schema';
