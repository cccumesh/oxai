-- Sanjay Aqua only. Run this once.
-- Rokda sirf jab driver khud number bhare. Andaz nahi.

alter table sa_day_trips
  add column if not exists rokda_jars int not null default 0;
