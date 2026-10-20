alter table public.reports
  add column if not exists reporter_user_id uuid references auth.users(id) on delete set null;

create index if not exists reports_reporter_user_id_idx
  on public.reports (reporter_user_id);

create sequence if not exists public.resigrid_report_number_seq;

select setval(
  'public.resigrid_report_number_seq',
  coalesce(
    (
      select max(substring(report_id from '^RPT-([0-9]+)$')::bigint)
      from public.reports
    ),
    0
  ) + 1,
  false
);

create or replace function public.assign_resigrid_report_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.category is distinct from 'goods'
    and (new.report_id is null or new.report_id !~ '^RPT-[0-9]+$') then
    new.report_id := 'RPT-' || lpad(nextval('public.resigrid_report_number_seq')::text, 4, '0');
  end if;

  if auth.uid() is not null then
    new.reporter_user_id := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists reports_assign_resigrid_metadata on public.reports;
create trigger reports_assign_resigrid_metadata
before insert on public.reports
for each row
execute function public.assign_resigrid_report_metadata();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reports'
      and policyname = 'resigrid_delete_own_reports'
  ) then
    create policy resigrid_delete_own_reports
      on public.reports
      for delete
      to authenticated
      using (reporter_user_id = auth.uid());
  end if;
end;
$$;
