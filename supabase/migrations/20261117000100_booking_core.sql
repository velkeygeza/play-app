-- PLAY booking core
-- Each physical unit (dart board, bowling lane, pool table, escape room) is one resource.
-- Apply this migration to the Supabase project before wiring the app to live data.

create extension if not exists btree_gist;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  address text,
  city text not null,
  country_code text not null default 'HU',
  timezone text not null default 'Europe/Budapest',
  phone text,
  email text,
  image_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venue_members (
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff'
    check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (venue_id, user_id)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

insert into public.activities (name, slug) values
  ('Darts', 'darts'),
  ('Billiards', 'billiards'),
  ('Bowling', 'bowling'),
  ('Foosball', 'foosball'),
  ('Table Tennis', 'table-tennis'),
  ('Mini Golf', 'mini-golf'),
  ('Padel', 'padel'),
  ('Squash', 'squash'),
  ('Escape Rooms', 'escape-rooms'),
  ('VR', 'vr'),
  ('Laser Tag', 'laser-tag')
on conflict (slug) do nothing;

create table if not exists public.venue_activities (
  venue_id uuid not null references public.venues(id) on delete cascade,
  activity_id uuid not null references public.activities(id),
  created_at timestamptz not null default now(),
  primary key (venue_id, activity_id)
);

-- One row = one independently bookable physical unit.
-- Example: three dartboards are three resources, not one resource with capacity 3.
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  activity_id uuid not null references public.activities(id),
  name text not null,
  description text,
  sort_order integer not null default 0,
  capacity integer not null default 2 check (capacity > 0),
  price_amount numeric(10,2) not null default 0 check (price_amount >= 0),
  currency text not null default 'HUF',
  pricing_unit_minutes integer not null default 60
    check (pricing_unit_minutes > 0),
  min_booking_minutes integer not null default 60
    check (min_booking_minutes > 0),
  max_booking_minutes integer
    check (max_booking_minutes is null or max_booking_minutes >= min_booking_minutes),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, name)
);

create index if not exists resources_venue_activity_idx
  on public.resources (venue_id, activity_id, is_active);

create table if not exists public.venue_opening_hours (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  unique (venue_id, weekday),
  check (
    (is_closed and opens_at is null and closes_at is null)
    or
    (not is_closed and opens_at is not null and closes_at is not null)
  )
);

create table if not exists public.resource_blackouts (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists resource_blackouts_resource_time_idx
  on public.resource_blackouts using gist
  (resource_id, tstzrange(starts_at, ends_at, '[)'));

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10)),
  resource_id uuid not null references public.resources(id),
  customer_id uuid not null references auth.users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  guest_count integer not null default 1 check (guest_count > 0),
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  total_price numeric(10,2) not null check (total_price >= 0),
  currency text not null default 'HUF',
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Prevent two active bookings from occupying the same physical unit at once.
  exclude using gist (
    resource_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);

create index if not exists bookings_customer_start_idx
  on public.bookings (customer_id, starts_at desc);

create index if not exists bookings_resource_start_idx
  on public.bookings (resource_id, starts_at);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.record_booking_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_events (booking_id, actor_id, event_type, details)
    values (new.id, auth.uid(), 'created',
      jsonb_build_object('status', new.status, 'resource_id', new.resource_id));
  elsif new.status is distinct from old.status then
    insert into public.booking_events (booking_id, actor_id, event_type, details)
    values (new.id, auth.uid(), 'status_changed',
      jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists booking_event_after_change on public.bookings;
create trigger booking_event_after_change
  after insert or update on public.bookings
  for each row execute procedure public.record_booking_event();

create or replace function public.is_venue_member(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.venue_members vm
    where vm.venue_id = p_venue_id and vm.user_id = auth.uid()
  );
$$;

create or replace function public.has_venue_role(p_venue_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.venue_members vm
    where vm.venue_id = p_venue_id
      and vm.user_id = auth.uid()
      and vm.role = any(p_roles)
  );
$$;

-- Atomic instant-booking endpoint. The exclusion constraint is the final
-- concurrency guard; the resource row lock also serializes booking attempts
-- for the same unit and produces predictable errors for the app.
create or replace function public.create_booking(
  p_resource_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_guest_count integer default 1,
  p_customer_note text default null
)
returns table (booking_id uuid, booking_code text, total_price numeric, currency text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resource public.resources%rowtype;
  v_venue_status text;
  v_duration_minutes numeric;
  v_total numeric(10,2);
  v_booking_id uuid;
  v_booking_code text;
begin
  if auth.uid() is null then
    raise exception 'Bejelentkezés szükséges a foglaláshoz.'
      using errcode = '28000';
  end if;

  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'Érvénytelen foglalási időpont.';
  end if;

  if p_starts_at <= now() then
    raise exception 'Csak jövőbeli időpont foglalható.';
  end if;

  select r.*, v.status
    into v_resource, v_venue_status
  from public.resources r
  join public.venues v on v.id = r.venue_id
  where r.id = p_resource_id
  for update of r;

  if not found or not v_resource.is_active or v_venue_status <> 'published' then
    raise exception 'Ez az eszköz jelenleg nem foglalható.';
  end if;

  v_duration_minutes := extract(epoch from (p_ends_at - p_starts_at)) / 60;

  if v_duration_minutes < v_resource.min_booking_minutes
     or (v_resource.max_booking_minutes is not null
         and v_duration_minutes > v_resource.max_booking_minutes) then
    raise exception 'A választott foglalási időtartam nem engedélyezett.';
  end if;

  if p_guest_count is null or p_guest_count < 1
     or p_guest_count > v_resource.capacity then
    raise exception 'A létszám nem megfelelő ehhez az eszközhöz.';
  end if;

  if exists (
    select 1 from public.resource_blackouts b
    where b.resource_id = p_resource_id
      and tstzrange(b.starts_at, b.ends_at, '[)')
          && tstzrange(p_starts_at, p_ends_at, '[)')
  ) then
    raise exception 'Ez az eszköz ebben az időpontban nem elérhető.';
  end if;

  v_total := round(
    (v_duration_minutes / v_resource.pricing_unit_minutes)
      * v_resource.price_amount,
    2
  );

  begin
    insert into public.bookings (
      resource_id, customer_id, starts_at, ends_at, guest_count,
      status, total_price, currency, customer_note
    )
    values (
      p_resource_id, auth.uid(), p_starts_at, p_ends_at, p_guest_count,
      'confirmed', v_total, v_resource.currency, p_customer_note
    )
    returning id, bookings.booking_code
      into v_booking_id, v_booking_code;
  exception when exclusion_violation then
    raise exception 'Sajnos ezt az eszközt erre az időpontra már lefoglalták.'
      using errcode = '23P01';
  end;

  return query
    select v_booking_id, v_booking_code, v_total, v_resource.currency;
end;
$$;

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.venue_members enable row level security;
alter table public.activities enable row level security;
alter table public.venue_activities enable row level security;
alter table public.resources enable row level security;
alter table public.venue_opening_hours enable row level security;
alter table public.resource_blackouts enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "Profiles are editable by their owner" on public.profiles;
create policy "Profiles are editable by their owner"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Published venues are public" on public.venues;
create policy "Published venues are public"
  on public.venues for select to anon, authenticated
  using (status = 'published' or public.is_venue_member(id));

drop policy if exists "Venue managers can update venues" on public.venues;
create policy "Venue managers can update venues"
  on public.venues for update to authenticated
  using (public.has_venue_role(id, array['owner', 'manager']))
  with check (public.has_venue_role(id, array['owner', 'manager']));

drop policy if exists "Members can view their venue memberships" on public.venue_members;
create policy "Members can view their venue memberships"
  on public.venue_members for select to authenticated
  using (user_id = auth.uid() or public.is_venue_member(venue_id));

drop policy if exists "Owners can manage venue memberships" on public.venue_members;
create policy "Owners can manage venue memberships"
  on public.venue_members for all to authenticated
  using (public.has_venue_role(venue_id, array['owner']))
  with check (public.has_venue_role(venue_id, array['owner']));

drop policy if exists "Activities are public" on public.activities;
create policy "Activities are public"
  on public.activities for select to anon, authenticated using (true);

drop policy if exists "Venue activities are visible" on public.venue_activities;
create policy "Venue activities are visible"
  on public.venue_activities for select to anon, authenticated
  using (
    exists (select 1 from public.venues v
      where v.id = venue_id and v.status = 'published')
    or public.is_venue_member(venue_id)
  );

drop policy if exists "Venue managers manage activities" on public.venue_activities;
create policy "Venue managers manage activities"
  on public.venue_activities for all to authenticated
  using (public.has_venue_role(venue_id, array['owner', 'manager']))
  with check (public.has_venue_role(venue_id, array['owner', 'manager']));

drop policy if exists "Active resources are public" on public.resources;
create policy "Active resources are public"
  on public.resources for select to anon, authenticated
  using (
    (is_active and exists (select 1 from public.venues v
      where v.id = venue_id and v.status = 'published'))
    or public.is_venue_member(venue_id)
  );

drop policy if exists "Venue managers manage resources" on public.resources;
create policy "Venue managers manage resources"
  on public.resources for all to authenticated
  using (public.has_venue_role(venue_id, array['owner', 'manager']))
  with check (public.has_venue_role(venue_id, array['owner', 'manager']));

drop policy if exists "Opening hours are visible" on public.venue_opening_hours;
create policy "Opening hours are visible"
  on public.venue_opening_hours for select to anon, authenticated
  using (
    exists (select 1 from public.venues v
      where v.id = venue_id and v.status = 'published')
    or public.is_venue_member(venue_id)
  );

drop policy if exists "Venue managers manage opening hours" on public.venue_opening_hours;
create policy "Venue managers manage opening hours"
  on public.venue_opening_hours for all to authenticated
  using (public.has_venue_role(venue_id, array['owner', 'manager']))
  with check (public.has_venue_role(venue_id, array['owner', 'manager']));

drop policy if exists "Venue members can view resource blackouts" on public.resource_blackouts;
create policy "Venue members can view resource blackouts"
  on public.resource_blackouts for select to authenticated
  using (exists (select 1 from public.resources r
    where r.id = resource_id and public.is_venue_member(r.venue_id)));

drop policy if exists "Venue managers manage resource blackouts" on public.resource_blackouts;
create policy "Venue managers manage resource blackouts"
  on public.resource_blackouts for all to authenticated
  using (exists (select 1 from public.resources r
    where r.id = resource_id
      and public.has_venue_role(r.venue_id, array['owner', 'manager'])))
  with check (exists (select 1 from public.resources r
    where r.id = resource_id
      and public.has_venue_role(r.venue_id, array['owner', 'manager'])));

drop policy if exists "Customers and venue staff can read bookings" on public.bookings;
create policy "Customers and venue staff can read bookings"
  on public.bookings for select to authenticated
  using (
    customer_id = auth.uid()
    or exists (select 1 from public.resources r
      where r.id = resource_id and public.is_venue_member(r.venue_id))
  );

drop policy if exists "Venue managers and staff can update bookings" on public.bookings;
create policy "Venue managers and staff can update bookings"
  on public.bookings for update to authenticated
  using (exists (select 1 from public.resources r
    where r.id = resource_id and public.is_venue_member(r.venue_id)))
  with check (exists (select 1 from public.resources r
    where r.id = resource_id and public.is_venue_member(r.venue_id)));

drop policy if exists "Booking participants can read booking events" on public.booking_events;
create policy "Booking participants can read booking events"
  on public.booking_events for select to authenticated
  using (
    exists (select 1 from public.bookings b
      where b.id = booking_id and (
        b.customer_id = auth.uid()
        or exists (select 1 from public.resources r
          where r.id = b.resource_id and public.is_venue_member(r.venue_id))
      ))
  );

revoke all on function public.create_booking(uuid, timestamptz, timestamptz, integer, text) from public;
grant execute on function public.create_booking(uuid, timestamptz, timestamptz, integer, text) to authenticated;

grant select on public.activities, public.venues, public.venue_activities,
  public.resources, public.venue_opening_hours to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.venue_members, public.bookings, public.booking_events to authenticated;
grant update on public.bookings to authenticated;
grant select, insert, update, delete on public.venue_activities, public.resources,
  public.venue_opening_hours, public.resource_blackouts, public.venue_members to authenticated;
