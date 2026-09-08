-- Sanjay Aqua only. Customer per-jar rate for owner bills.
alter table sa_customers add column if not exists jar_rate numeric not null default 0;
notify pgrst, 'reload schema';
