alter table public.reports
  add column if not exists impact_count integer not null default 1,
  add column if not exists separate_incident boolean not null default false;

create table if not exists public.report_upvotes (
  report_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create index if not exists report_upvotes_user_id_report_id_idx
  on public.report_upvotes (user_id, report_id);

alter table public.report_upvotes enable row level security;
revoke all on table public.report_upvotes from anon, authenticated;
grant select on table public.report_upvotes to authenticated;

drop policy if exists report_upvotes_select_own on public.report_upvotes;
create policy report_upvotes_select_own
  on public.report_upvotes
  for select
  to authenticated
  using (user_id = auth.uid());

insert into public.report_upvotes (report_id, user_id)
select report_id, reporter_user_id
  from public.reports
  where reporter_user_id is not null
    and category is distinct from 'goods'
on conflict do nothing;

create or replace function public.register_report_creator_impact()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.reporter_user_id is not null and new.category is distinct from 'goods' then
    insert into public.report_upvotes (report_id, user_id)
    values (new.report_id, new.reporter_user_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_register_creator_impact on public.reports;
create trigger reports_register_creator_impact
after insert on public.reports
for each row
execute function public.register_report_creator_impact();

create or replace function public.remove_report_upvotes()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from public.report_upvotes where report_id = old.report_id;
  return old;
end;
$$;

drop trigger if exists reports_remove_upvotes on public.reports;
create trigger reports_remove_upvotes
after delete on public.reports
for each row
execute function public.remove_report_upvotes();

create or replace function public.upvote_report(p_report_id text)
returns table (impact_count integer, already_voted boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
  v_inserted_rows integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to confirm that you are affected by this report.';
  end if;

  select reports.status
    into v_status
    from public.reports
    where reports.report_id = p_report_id
    for update;

  if not found then
    raise exception 'The report could not be found.';
  end if;
  if lower(coalesce(v_status, '')) in ('resolved', 'closed', 'fixed') then
    raise exception 'Resolved reports can no longer receive impact votes.';
  end if;

  insert into public.report_upvotes (report_id, user_id)
  values (p_report_id, v_user_id)
  on conflict do nothing;
  get diagnostics v_inserted_rows = row_count;

  if v_inserted_rows = 1 then
    update public.reports
      set impact_count = coalesce(public.reports.impact_count, 1) + 1
      where public.reports.report_id = p_report_id;
  end if;

  return query
    select reports.impact_count, v_inserted_rows = 0
      from public.reports
      where reports.report_id = p_report_id;
end;
$$;

revoke all on function public.upvote_report(text) from public;
grant execute on function public.upvote_report(text) to authenticated;
