-- Daily|Order: alag gadi load (trip) per mode. Live DB pe ek baar Run.
alter table sa_customers add column if not exists route_kind text not null default 'market';
alter table sa_customers add column if not exists thermos_rate numeric not null default 0;
alter table sa_deliveries add column if not exists drop_place text default '';
alter table sa_deliveries add column if not exists stop_no int not null default 1;
alter table sa_deliveries drop constraint if exists sa_deliveries_device_id_customer_id_work_date_key;
create unique index if not exists sa_deliveries_device_cust_date_stop
  on sa_deliveries (device_id, customer_id, work_date, stop_no);

alter table sa_day_trips add column if not exists route_kind text not null default 'market';
alter table sa_day_trips drop constraint if exists sa_day_trips_device_id_work_date_key;
create unique index if not exists sa_day_trips_device_date_kind
  on sa_day_trips (device_id, work_date, route_kind);

-- Purane customers / trips: DM type se kind
update sa_customers c
set route_kind = case when coalesce(d.delivery_type, 'market') = 'order' then 'order' else 'market' end
from sa_devices d
where c.device_id = d.id;

update sa_day_trips t
set route_kind = case
  when coalesce(d.delivery_type, 'market') = 'order' then 'order'
  when coalesce(t.thermos_out, 0) > 0 or coalesce(t.thermos_back, 0) > 0 then 'order'
  else 'market'
end
from sa_devices d
where t.device_id = d.id;
