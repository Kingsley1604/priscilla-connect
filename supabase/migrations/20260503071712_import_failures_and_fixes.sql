-- import_failures table for SA failure history + real-time alerting
create table if not exists public.import_failures (
  id uuid primary key default gen_random_uuid(),
  error_message text not null,
  error_details text,
  exam_type text,
  subjects text[],
  student_id uuid,
  student_name text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.import_failures enable row level security;

drop policy if exists "import failures readable by super admin" on public.import_failures;
create policy "import failures readable by super admin"
  on public.import_failures for select
  to authenticated
  using (public.is_super_admin(auth.uid()));

drop policy if exists "import failures updatable by super admin" on public.import_failures;
create policy "import failures updatable by super admin"
  on public.import_failures for update
  to authenticated
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

drop policy if exists "import failures insert service" on public.import_failures;
create policy "import failures insert service"
  on public.import_failures for insert
  to authenticated
  with check (true);

create index if not exists idx_import_failures_created on public.import_failures (created_at desc);

-- Enable realtime so SA portal gets instant failure notifications
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.import_failures';
    exception when others then null;
    end;
    begin
      execute 'alter publication supabase_realtime add table public.notifications';
    exception when others then null;
    end;
  end if;
end $$;

alter table public.import_failures replica identity full;
