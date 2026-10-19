-- Apply once to a new Supabase project. No service-role key is used by the app.
begin;
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 8 and 240),
  description text not null default '' check (char_length(description) <= 4000),
  deadline date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 240),
  description text not null default '' check (char_length(description) <= 4000),
  estimated_minutes integer not null check (estimated_minutes between 1 and 600),
  due_date date not null,
  position integer not null check (position between 0 and 99),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (goal_id, position)
);
create index goals_owner_created_idx on public.goals(user_id, created_at desc);
-- The unique constraint above also indexes tasks.goal_id.
alter table public.goals enable row level security;
alter table public.goals force row level security;
alter table public.tasks enable row level security;
alter table public.tasks force row level security;

create policy goals_select on public.goals for select to authenticated using ((select auth.uid()) = user_id);
create policy goals_insert on public.goals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy goals_update on public.goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy goals_delete on public.goals for delete to authenticated using ((select auth.uid()) = user_id);

create policy tasks_select on public.tasks for select to authenticated using (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())));
create policy tasks_insert on public.tasks for insert to authenticated with check (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())));
create policy tasks_update on public.tasks for update to authenticated using (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid()))) with check (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())));
create policy tasks_delete on public.tasks for delete to authenticated using (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())));

-- Explicit privileges prevent owner, goal_id, ID, or timestamp reassignment.
revoke all on public.goals, public.tasks from public, anon, authenticated;
grant select, delete on public.goals, public.tasks to authenticated;
grant insert (title, description, deadline) on public.goals to authenticated;
grant update (title, description, deadline) on public.goals to authenticated;
grant insert (goal_id, title, description, estimated_minutes, due_date, position) on public.tasks to authenticated;
grant update (completed) on public.tasks to authenticated;

create function public.touch_goal_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger goals_updated_at before update on public.goals
for each row execute function public.touch_goal_updated_at();

-- Runs with the caller's privileges and RLS, never an administrator's.
create function public.create_goal_plan(p_title text, p_description text, p_deadline date, p_tasks jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  new_goal_id uuid;
  total_minutes integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_tasks is null or jsonb_typeof(p_tasks) <> 'array' then
    raise exception 'Expected task array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_tasks) <> 5 then raise exception 'Expected five planning stages' using errcode = '22023'; end if;
  if p_deadline is null or p_deadline < current_date - 1 or p_deadline > current_date + 366 then
    raise exception 'Invalid deadline' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_tasks) as t(due_date date) where due_date is null or due_date < current_date - 1 or due_date > p_deadline) then
    raise exception 'Invalid task date' using errcode = '22023';
  end if;
  select sum(t.estimated_minutes) into total_minutes from jsonb_to_recordset(p_tasks) as t(estimated_minutes integer);
  if total_minutes is null or total_minutes not between 15 and 600 then raise exception 'Invalid time budget' using errcode = '22023'; end if;
  insert into public.goals(title, description, deadline)
  values (btrim(p_title), coalesce(p_description, ''), p_deadline) returning id into new_goal_id;
  insert into public.tasks(goal_id, title, description, estimated_minutes, due_date, position)
  select new_goal_id, item->>'title', coalesce(item->>'description', ''),
    (item->>'estimated_minutes')::integer, (item->>'due_date')::date, (ordinality - 1)::integer
  from jsonb_array_elements(p_tasks) with ordinality as stages(item, ordinality);
  return new_goal_id;
end;
$$;
revoke all on function public.create_goal_plan(text,text,date,jsonb) from public, anon;
grant execute on function public.create_goal_plan(text,text,date,jsonb) to authenticated;
revoke all on function public.touch_goal_updated_at() from public, anon, authenticated;
commit;
