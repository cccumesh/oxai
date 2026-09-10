-- App se pehle baki paise (opening udhari). Live DB pe ek baar Run.
alter table sa_customers add column if not exists opening_balance numeric not null default 0;
