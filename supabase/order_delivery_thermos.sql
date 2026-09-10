-- Order / catering delivery type + thermos. Live DB pe ek baar Run.
alter table sa_devices add column if not exists delivery_type text not null default 'market';

alter table sa_day_trips add column if not exists thermos_out int not null default 0;
alter table sa_day_trips add column if not exists thermos_back int not null default 0;

alter table sa_deliveries add column if not exists thermos_given int not null default 0;
alter table sa_deliveries add column if not exists thermos_collected int not null default 0;

alter table sa_customers add column if not exists pending_thermos int not null default 0;
alter table sa_customers add column if not exists thermos_rate numeric not null default 0;
alter table sa_deliveries add column if not exists drop_place text default '';
