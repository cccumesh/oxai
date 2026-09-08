-- Sanjay Aqua only. Adds optional place on sa_customers. Does not touch other tables.

alter table sa_customers add column if not exists place text default '';
