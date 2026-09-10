-- Daily|Order switch: customer route_kind + DM type "both". Live DB pe ek baar Run.
alter table sa_customers add column if not exists route_kind text not null default 'market';
alter table sa_customers add column if not exists thermos_rate numeric not null default 0;
alter table sa_deliveries add column if not exists drop_place text default '';
alter table sa_deliveries add column if not exists stop_no int not null default 1;
alter table sa_deliveries drop constraint if exists sa_deliveries_device_id_customer_id_work_date_key;
create unique index if not exists sa_deliveries_device_cust_date_stop
  on sa_deliveries (device_id, customer_id, work_date, stop_no);

-- Purane customers: unke DM ke type se route_kind
update sa_customers c
set route_kind = case when coalesce(d.delivery_type, 'market') = 'order' then 'order' else 'market' end
from sa_devices d
where c.device_id = d.id;
