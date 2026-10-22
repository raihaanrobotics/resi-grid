alter table public.water_nodes
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.power_nodes
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.spaza_stores
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.community_food_aid
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.water_nodes enable row level security;
alter table public.power_nodes enable row level security;
alter table public.spaza_stores enable row level security;
alter table public.community_food_aid enable row level security;

grant select on public.water_nodes, public.power_nodes, public.spaza_stores, public.community_food_aid to anon, authenticated;
grant insert, delete on public.water_nodes, public.power_nodes, public.spaza_stores, public.community_food_aid to authenticated;

drop policy if exists water_nodes_public_read on public.water_nodes;
create policy water_nodes_public_read on public.water_nodes for select to anon, authenticated using (true);
drop policy if exists water_nodes_owner_insert on public.water_nodes;
create policy water_nodes_owner_insert on public.water_nodes for insert to authenticated with check (owner_user_id = auth.uid());
drop policy if exists water_nodes_owner_delete on public.water_nodes;
create policy water_nodes_owner_delete on public.water_nodes for delete to authenticated using (owner_user_id = auth.uid());

drop policy if exists power_nodes_public_read on public.power_nodes;
create policy power_nodes_public_read on public.power_nodes for select to anon, authenticated using (true);
drop policy if exists power_nodes_owner_insert on public.power_nodes;
create policy power_nodes_owner_insert on public.power_nodes for insert to authenticated with check (owner_user_id = auth.uid());
drop policy if exists power_nodes_owner_delete on public.power_nodes;
create policy power_nodes_owner_delete on public.power_nodes for delete to authenticated using (owner_user_id = auth.uid());

drop policy if exists spaza_stores_public_read on public.spaza_stores;
create policy spaza_stores_public_read on public.spaza_stores for select to anon, authenticated using (true);
drop policy if exists spaza_stores_owner_insert on public.spaza_stores;
create policy spaza_stores_owner_insert on public.spaza_stores for insert to authenticated with check (owner_user_id = auth.uid());
drop policy if exists spaza_stores_owner_delete on public.spaza_stores;
create policy spaza_stores_owner_delete on public.spaza_stores for delete to authenticated using (owner_user_id = auth.uid());

drop policy if exists community_food_aid_public_read on public.community_food_aid;
create policy community_food_aid_public_read on public.community_food_aid for select to anon, authenticated using (true);
drop policy if exists community_food_aid_owner_insert on public.community_food_aid;
create policy community_food_aid_owner_insert on public.community_food_aid for insert to authenticated with check (owner_user_id = auth.uid());
drop policy if exists community_food_aid_owner_delete on public.community_food_aid;
create policy community_food_aid_owner_delete on public.community_food_aid for delete to authenticated using (owner_user_id = auth.uid());

drop policy if exists reports_owner_delete on public.reports;
create policy reports_owner_delete
  on public.reports
  for delete
  to authenticated
  using (reporter_user_id = auth.uid());
