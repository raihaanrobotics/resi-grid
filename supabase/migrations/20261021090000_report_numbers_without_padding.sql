create or replace function public.assign_resigrid_report_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.category is distinct from 'goods'
    and (new.report_id is null or new.report_id !~ '^RPT-[0-9]+$') then
    new.report_id := 'RPT-' || nextval('public.resigrid_report_number_seq')::text;
  end if;

  if auth.uid() is not null then
    new.reporter_user_id := auth.uid();
  end if;

  return new;
end;
$$;
