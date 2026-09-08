-- Sanjay Aqua only. Run this once. Does not touch old tables.
-- Gadi mein gire / toot gaye bhare jar (waste).

alter table sa_day_trips
  add column if not exists waste_jars int not null default 0;
