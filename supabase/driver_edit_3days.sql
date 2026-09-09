-- Delivery man: sirf aaj + kal + 2 din pehle edit.
-- Purana hisaab lock. SQL Editor mein yeh block Run.

create or replace function sa_india_today()
returns date
language sql
stable
as $$
  select (timezone('Asia/Kolkata', now()))::date;
$$;

create or replace function sa_driver_can_edit_date(p_date date)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select sa_auth_role() = 'owner'
    or (p_date is not null and p_date >= sa_india_today() - 2);
$$;

grant execute on function sa_india_today() to anon, authenticated;
grant execute on function sa_driver_can_edit_date(date) to anon, authenticated;

drop policy if exists sa_deliveries_insert on sa_deliveries;
drop policy if exists sa_deliveries_update on sa_deliveries;
drop policy if exists sa_deliveries_delete on sa_deliveries;
drop policy if exists sa_day_trips_insert on sa_day_trips;
drop policy if exists sa_day_trips_update on sa_day_trips;
drop policy if exists sa_day_trips_delete on sa_day_trips;

create policy sa_deliveries_insert on sa_deliveries
  for insert with check (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date));
create policy sa_deliveries_update on sa_deliveries
  for update using (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date))
  with check (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date));
create policy sa_deliveries_delete on sa_deliveries
  for delete using (false);

create policy sa_day_trips_insert on sa_day_trips
  for insert with check (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date));
create policy sa_day_trips_update on sa_day_trips
  for update using (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date))
  with check (sa_can_device(org_id, device_id) and sa_driver_can_edit_date(work_date));
create policy sa_day_trips_delete on sa_day_trips
  for delete using (false);
