-- Phase 2 Ride + Padala trips domain (ADR-005 / ADR-006)
-- Food orders/deliveries/payments stay unchanged.

create type public.trip_service_type as enum ('ride', 'courier');
create type public.trip_status as enum (
  'requested', 'accepted', 'arrived_pickup', 'in_progress', 'completed', 'cancelled'
);
create type public.parcel_size as enum ('small', 'medium', 'large');
create type public.trip_payment_kind as enum ('platform_fee', 'rider_payout');
create type public.trip_payee as enum ('platform', 'rider');

create table public.trip_fare_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'default',
  service_type public.trip_service_type not null,
  service_area_code text references public.service_areas (code),
  base_fee numeric(12,2) not null default 40,
  free_km numeric(6,2) not null default 1,
  per_km_fee numeric(12,2) not null default 12,
  small_surcharge numeric(12,2) not null default 0,
  medium_surcharge numeric(12,2) not null default 0,
  large_surcharge numeric(12,2) not null default 0,
  platform_fee_bps int not null default 2000 check (platform_fee_bps between 0 and 10000),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  trip_number text not null unique,
  customer_id uuid not null references public.profiles (id),
  rider_id uuid references public.profiles (id),
  service_type public.trip_service_type not null,
  service_area_code text not null references public.service_areas (code),
  status public.trip_status not null default 'requested',
  pickup_label text not null,
  pickup_line1 text not null,
  pickup_barangay text not null,
  pickup_city text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_label text not null,
  dropoff_line1 text not null,
  dropoff_barangay text not null,
  dropoff_city text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  distance_km numeric(8,2) not null default 0,
  payment_method public.payment_method not null default 'cod',
  fare numeric(12,2) not null check (fare >= 0),
  platform_fee numeric(12,2) not null check (platform_fee >= 0),
  rider_earning numeric(12,2) not null check (rider_earning >= 0),
  size_surcharge numeric(12,2) not null default 0 check (size_surcharge >= 0),
  parcel_size public.parcel_size,
  parcel_description text,
  recipient_name text,
  recipient_phone text,
  parcel_photo_path text,
  notes text,
  cancel_reason text,
  accepted_at timestamptz,
  arrived_pickup_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_fare_split check (fare = platform_fee + rider_earning)
);

create table public.trip_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  from_status public.trip_status,
  to_status public.trip_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.trip_payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  kind public.trip_payment_kind not null,
  amount numeric(12,2) not null check (amount >= 0),
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  payee public.trip_payee not null,
  created_at timestamptz not null default now(),
  constraint trip_payee_not_merchant check (payee in ('platform', 'rider'))
);

create index idx_trips_customer on public.trips (customer_id, created_at desc);
create index idx_trips_status on public.trips (status, rider_id);
create index idx_trip_payments_trip on public.trip_payments (trip_id);

create trigger trips_updated before update on public.trips
for each row execute function public.set_updated_at();

create or replace function public.distance_km(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns numeric
language sql
immutable
as $$
  select (
    6371 * acos(
      least(1::float, greatest(-1::float,
        cos(radians(lat1)) * cos(radians(lat2)) *
        cos(radians(lng2) - radians(lng1)) +
        sin(radians(lat1)) * sin(radians(lat2))
      ))
    )
  )::numeric(8,2);
$$;

create or replace function public.point_in_service_area(
  p_code text,
  p_lat double precision,
  p_lng double precision
)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  v_area public.service_areas;
begin
  select * into v_area from public.service_areas where code = p_code and is_active = true;
  if v_area is null then
    return false;
  end if;
  return public.distance_km(v_area.center_lat, v_area.center_lng, p_lat, p_lng) <= v_area.radius_km;
end;
$$;

create or replace function public.generate_trip_number()
returns text
language plpgsql
as $$
begin
  return 'TRP-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
end;
$$;

create or replace function public.compute_trip_fare(
  p_service_type public.trip_service_type,
  p_service_area_code text,
  p_distance numeric,
  p_parcel_size public.parcel_size
)
returns table (
  fare numeric,
  platform_fee numeric,
  rider_earning numeric,
  size_surcharge numeric,
  distance_fee numeric,
  base_fee numeric
)
language plpgsql
stable
set search_path = public
as $$
declare
  v_rule public.trip_fare_rules;
  v_billable numeric;
  v_distance_fee numeric;
  v_size numeric := 0;
  v_fare numeric;
  v_platform numeric;
begin
  select * into v_rule from public.trip_fare_rules
  where is_active = true
    and service_type = p_service_type
    and (service_area_code = p_service_area_code or service_area_code is null)
  order by service_area_code nulls last
  limit 1;

  if v_rule is null then
    raise exception 'no trip fare rule configured';
  end if;

  v_billable := greatest(0, p_distance - v_rule.free_km);
  v_distance_fee := v_billable * v_rule.per_km_fee;

  if p_service_type = 'courier' then
    v_size := case p_parcel_size
      when 'medium' then v_rule.medium_surcharge
      when 'large' then v_rule.large_surcharge
      else v_rule.small_surcharge
    end;
  end if;

  v_fare := round(v_rule.base_fee + v_distance_fee + v_size, 2);
  v_platform := round(v_fare * v_rule.platform_fee_bps / 10000.0, 2);

  return query select
    v_fare,
    v_platform,
    v_fare - v_platform,
    v_size,
    round(v_distance_fee, 2),
    v_rule.base_fee;
end;
$$;

create or replace function public.quote_trip(
  p_service_type public.trip_service_type,
  p_service_area_code text,
  p_pickup_lat double precision,
  p_pickup_lng double precision,
  p_dropoff_lat double precision,
  p_dropoff_lng double precision,
  p_parcel_size public.parcel_size default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_distance numeric;
  v_row record;
begin
  if not public.point_in_service_area(p_service_area_code, p_pickup_lat, p_pickup_lng) then
    raise exception 'pickup is outside the selected service area';
  end if;
  if not exists (
    select 1 from public.service_areas a
    where a.is_active
      and public.point_in_service_area(a.code, p_dropoff_lat, p_dropoff_lng)
  ) then
    raise exception 'dropoff is outside launch areas';
  end if;

  v_distance := public.distance_km(p_pickup_lat, p_pickup_lng, p_dropoff_lat, p_dropoff_lng);
  select * into v_row from public.compute_trip_fare(
    p_service_type, p_service_area_code, v_distance, p_parcel_size
  );

  return jsonb_build_object(
    'distanceKm', v_distance,
    'baseFee', v_row.base_fee,
    'distanceFee', v_row.distance_fee,
    'sizeSurcharge', v_row.size_surcharge,
    'fare', v_row.fare,
    'platformFee', v_row.platform_fee,
    'riderEarning', v_row.rider_earning
  );
end;
$$;

create or replace function public.append_trip_event(
  p_trip_id uuid,
  p_from public.trip_status,
  p_to public.trip_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trip_events (trip_id, actor_id, from_status, to_status, note)
  values (p_trip_id, auth.uid(), p_from, p_to, p_note);
end;
$$;

create or replace function public.request_trip(
  p_service_type public.trip_service_type,
  p_service_area_code text,
  p_pickup_label text,
  p_pickup_line1 text,
  p_pickup_barangay text,
  p_pickup_city text,
  p_pickup_lat double precision,
  p_pickup_lng double precision,
  p_dropoff_label text,
  p_dropoff_line1 text,
  p_dropoff_barangay text,
  p_dropoff_city text,
  p_dropoff_lat double precision,
  p_dropoff_lng double precision,
  p_payment_method public.payment_method,
  p_parcel_size public.parcel_size default null,
  p_parcel_description text default null,
  p_recipient_name text default null,
  p_recipient_phone text default null,
  p_notes text default null
)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_quote jsonb;
  v_trip public.trips;
begin
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile is null or v_profile.role <> 'customer' then
    raise exception 'customer account required';
  end if;
  if v_profile.verification_level < 2 then
    raise exception 'verification level 2 required to request trips';
  end if;

  if p_service_type = 'courier' then
    if coalesce(trim(p_parcel_description), '') = '' then
      raise exception 'padala requires an item description';
    end if;
    if coalesce(trim(p_recipient_name), '') = '' or coalesce(trim(p_recipient_phone), '') = '' then
      raise exception 'padala requires recipient name and phone';
    end if;
  end if;

  v_quote := public.quote_trip(
    p_service_type,
    p_service_area_code,
    p_pickup_lat,
    p_pickup_lng,
    p_dropoff_lat,
    p_dropoff_lng,
    p_parcel_size
  );

  insert into public.trips (
    trip_number, customer_id, service_type, service_area_code, status,
    pickup_label, pickup_line1, pickup_barangay, pickup_city, pickup_lat, pickup_lng,
    dropoff_label, dropoff_line1, dropoff_barangay, dropoff_city, dropoff_lat, dropoff_lng,
    distance_km, payment_method, fare, platform_fee, rider_earning, size_surcharge,
    parcel_size, parcel_description, recipient_name, recipient_phone, notes
  ) values (
    public.generate_trip_number(), auth.uid(), p_service_type, p_service_area_code, 'requested',
    p_pickup_label, p_pickup_line1, p_pickup_barangay, p_pickup_city, p_pickup_lat, p_pickup_lng,
    p_dropoff_label, p_dropoff_line1, p_dropoff_barangay, p_dropoff_city, p_dropoff_lat, p_dropoff_lng,
    (v_quote->>'distanceKm')::numeric,
    p_payment_method,
    (v_quote->>'fare')::numeric,
    (v_quote->>'platformFee')::numeric,
    (v_quote->>'riderEarning')::numeric,
    (v_quote->>'sizeSurcharge')::numeric,
    case when p_service_type = 'courier' then p_parcel_size else null end,
    case when p_service_type = 'courier' then p_parcel_description else null end,
    case when p_service_type = 'courier' then p_recipient_name else null end,
    case when p_service_type = 'courier' then p_recipient_phone else null end,
    p_notes
  ) returning * into v_trip;

  insert into public.trip_payments (trip_id, kind, amount, method, status, payee) values
    (v_trip.id, 'platform_fee', v_trip.platform_fee, p_payment_method, 'pending', 'platform'),
    (v_trip.id, 'rider_payout', v_trip.rider_earning, p_payment_method, 'pending', 'rider');

  perform public.append_trip_event(v_trip.id, null, 'requested', 'created');
  return v_trip;
end;
$$;

create or replace function public.accept_trip(p_trip_id uuid)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles;
  t public.trips;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.role <> 'rider' or p.verification_level < 4 then
    raise exception 'verified rider required';
  end if;

  update public.trips
  set rider_id = auth.uid(), status = 'accepted', accepted_at = now()
  where id = p_trip_id and status = 'requested' and rider_id is null
  returning * into t;

  if t is null then
    raise exception 'trip unavailable';
  end if;

  perform public.append_trip_event(t.id, 'requested', 'accepted', null);
  return t;
end;
$$;

create or replace function public.advance_trip(
  p_trip_id uuid,
  p_to_status public.trip_status
)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.trips;
  v_from public.trip_status;
  v_expected public.trip_status;
begin
  select * into t from public.trips where id = p_trip_id;
  if t is null then
    raise exception 'trip not found';
  end if;
  if t.rider_id <> auth.uid() and not public.is_admin() then
    raise exception 'assigned rider required';
  end if;

  v_from := t.status;
  v_expected := case t.status
    when 'accepted' then 'arrived_pickup'::public.trip_status
    when 'arrived_pickup' then 'in_progress'::public.trip_status
    when 'in_progress' then 'completed'::public.trip_status
    else null
  end;

  if v_expected is null or p_to_status <> v_expected then
    raise exception 'illegal trip transition';
  end if;

  update public.trips
  set
    status = p_to_status,
    arrived_pickup_at = case when p_to_status = 'arrived_pickup' then now() else arrived_pickup_at end,
    started_at = case when p_to_status = 'in_progress' then now() else started_at end,
    completed_at = case when p_to_status = 'completed' then now() else completed_at end
  where id = p_trip_id
  returning * into t;

  perform public.append_trip_event(t.id, v_from, p_to_status, null);
  return t;
end;
$$;

create or replace function public.cancel_trip(
  p_trip_id uuid,
  p_reason text default null
)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.trips;
  p public.profiles;
  v_from public.trip_status;
begin
  select * into t from public.trips where id = p_trip_id;
  if t is null then
    raise exception 'trip not found';
  end if;
  select * into p from public.profiles where id = auth.uid();
  v_from := t.status;

  if t.status in ('completed', 'cancelled') then
    raise exception 'trip cannot be cancelled';
  end if;

  if public.is_admin() then
    null;
  elsif p.role = 'customer' and t.customer_id = auth.uid() then
    if t.status <> 'requested' then
      raise exception 'customer can cancel only while requested';
    end if;
  elsif p.role = 'rider' and t.rider_id = auth.uid() then
    if t.status not in ('accepted', 'arrived_pickup', 'in_progress') then
      raise exception 'rider cannot cancel this trip';
    end if;
  else
    raise exception 'not allowed to cancel trip';
  end if;

  update public.trips
  set status = 'cancelled', cancel_reason = p_reason, cancelled_at = now()
  where id = p_trip_id
  returning * into t;

  perform public.append_trip_event(t.id, v_from, 'cancelled', p_reason);
  return t;
end;
$$;

alter table public.trip_fare_rules enable row level security;
alter table public.trips enable row level security;
alter table public.trip_events enable row level security;
alter table public.trip_payments enable row level security;

create policy "trip fare rules read"
  on public.trip_fare_rules for select using (true);

create policy "trip fare rules admin write"
  on public.trip_fare_rules for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "trips participant read"
  on public.trips for select
  using (
    public.is_admin()
    or customer_id = auth.uid()
    or rider_id = auth.uid()
    or (status = 'requested' and exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'rider'
    ))
  );

create policy "trips no direct insert"
  on public.trips for insert
  with check (false);

create policy "trips no direct update"
  on public.trips for update
  using (false);

create policy "trip events participant read"
  on public.trip_events for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (
          public.is_admin()
          or t.customer_id = auth.uid()
          or t.rider_id = auth.uid()
        )
    )
  );

create policy "trip payments participant read"
  on public.trip_payments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (t.customer_id = auth.uid() or t.rider_id = auth.uid())
    )
  );

create policy "trip payments no direct write"
  on public.trip_payments for insert
  with check (false);

insert into storage.buckets (id, name, public) values
  ('parcel-photos', 'parcel-photos', false)
on conflict (id) do nothing;

create policy "parcel photos own folder read"
  on storage.objects for select
  using (
    bucket_id = 'parcel-photos'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "parcel photos own folder write"
  on storage.objects for insert
  with check (
    bucket_id = 'parcel-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

grant select, insert, update, delete on public.trip_fare_rules, public.trips, public.trip_events, public.trip_payments to authenticated;
grant select on public.trip_fare_rules, public.trips, public.trip_events, public.trip_payments to anon;

grant execute on function public.distance_km(double precision, double precision, double precision, double precision) to authenticated;
grant execute on function public.point_in_service_area(text, double precision, double precision) to authenticated;
grant execute on function public.generate_trip_number() to authenticated;
grant execute on function public.quote_trip(
  public.trip_service_type, text, double precision, double precision, double precision, double precision, public.parcel_size
) to authenticated;
grant execute on function public.request_trip(
  public.trip_service_type, text, text, text, text, text, double precision, double precision,
  text, text, text, text, double precision, double precision, public.payment_method,
  public.parcel_size, text, text, text, text
) to authenticated;
grant execute on function public.accept_trip(uuid) to authenticated;
grant execute on function public.advance_trip(uuid, public.trip_status) to authenticated;
grant execute on function public.cancel_trip(uuid, text) to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.trips;
  exception when duplicate_object then null;
  end;
end $$;
