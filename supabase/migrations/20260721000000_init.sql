-- Bolantero core schema
create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'merchant', 'rider', 'admin');
create type public.verification_status as enum ('draft', 'pending', 'approved', 'rejected');
create type public.merchant_status as enum ('draft', 'pending', 'approved', 'suspended');
create type public.order_status as enum (
  'pending', 'confirmed', 'preparing', 'ready', 'rejected', 'cancelled', 'completed'
);
create type public.delivery_status as enum (
  'awaiting_rider', 'assigned', 'arrived_store', 'picked_up', 'delivered', 'cancelled'
);
create type public.delivery_type as enum (
  'immediate', 'scheduled', 'express', 'multi_stop', 'bulk', 'corporate', 'p2p'
);
create type public.payment_method as enum ('cod', 'online');
create type public.payment_kind as enum ('product', 'delivery', 'cod_fee');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  display_name text,
  phone text,
  avatar_url text,
  verification_level int not null default 1 check (verification_level between 1 and 4),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_areas (
  code text primary key,
  name text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_km numeric(6,2) not null default 12,
  is_active boolean not null default true
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  line1 text not null,
  barangay text not null,
  city text not null,
  service_area_code text not null references public.service_areas (code),
  lat double precision not null,
  lng double precision not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.verification_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_level int not null check (target_level between 2 and 4),
  id_type text,
  id_number text,
  id_image_path text,
  selfie_path text,
  license_image_path text,
  vehicle_doc_path text,
  status public.verification_status not null default 'pending',
  reviewer_id uuid references public.profiles (id),
  reviewer_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  category_slug text not null,
  service_area_code text not null references public.service_areas (code),
  address_line text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  cover_image_url text,
  status public.merchant_status not null default 'draft',
  opens_at time,
  closes_at time,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.merchant_documents (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

create table public.categories (
  slug text primary key,
  name text not null,
  phase int not null default 1,
  is_active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  category_slug text not null references public.categories (slug),
  name text not null,
  description text,
  price numeric(12,2) not null check (price > 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_fee_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'default',
  service_area_code text references public.service_areas (code),
  base_fee numeric(12,2) not null default 49,
  free_km numeric(6,2) not null default 2,
  per_km_fee numeric(12,2) not null default 10,
  express_multiplier numeric(6,2) not null default 1.5,
  scheduled_surcharge numeric(12,2) not null default 15,
  cod_handling_fee numeric(12,2) not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.profiles (id),
  merchant_id uuid not null references public.merchants (id),
  address_id uuid not null references public.addresses (id),
  status public.order_status not null default 'pending',
  delivery_type public.delivery_type not null default 'immediate',
  payment_method public.payment_method not null default 'cod',
  scheduled_for timestamptz,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null check (delivery_fee >= 0),
  cod_fee numeric(12,2) not null default 0 check (cod_fee >= 0),
  total numeric(12,2) generated always as (subtotal + delivery_fee + cod_fee) stored,
  distance_km numeric(8,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_merchant_commission check (subtotal >= 0)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id),
  name text not null,
  unit_price numeric(12,2) not null check (unit_price > 0),
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) generated always as (unit_price * quantity) stored
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  rider_id uuid references public.profiles (id),
  status public.delivery_status not null default 'awaiting_rider',
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_lat double precision,
  dropoff_lng double precision,
  proof_image_path text,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  rider_earning numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  kind public.payment_kind not null,
  amount numeric(12,2) not null check (amount >= 0),
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  payee text not null check (payee in ('merchant', 'platform')),
  created_at timestamptz not null default now()
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  rater_id uuid not null references public.profiles (id),
  ratee_id uuid not null references public.profiles (id),
  target text not null check (target in ('merchant', 'rider', 'customer')),
  score int not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id, rater_id, target)
);

create table public.rider_presence (
  rider_id uuid primary key references public.profiles (id) on delete cascade,
  is_online boolean not null default false,
  last_lat double precision,
  last_lng double precision,
  updated_at timestamptz not null default now()
);

create index idx_merchants_area on public.merchants (service_area_code, status);
create index idx_products_merchant on public.products (merchant_id, is_available);
create index idx_orders_customer on public.orders (customer_id, created_at desc);
create index idx_orders_merchant on public.orders (merchant_id, status);
create index idx_deliveries_status on public.deliveries (status, rider_id);
create index idx_verification_status on public.verification_submissions (status, submitted_at);

-- helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();
create trigger merchants_updated before update on public.merchants
for each row execute function public.set_updated_at();
create trigger products_updated before update on public.products
for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders
for each row execute function public.set_updated_at();
create trigger deliveries_updated before update on public.deliveries
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, display_name, role)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'display_name', 'Bolantero User'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
begin
  return 'BOL-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
end;
$$;

-- approve verification
create or replace function public.review_verification(
  submission_id uuid,
  approve boolean,
  notes text default null
)
returns public.verification_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.verification_submissions;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  update public.verification_submissions
  set
    status = case when approve then 'approved'::public.verification_status else 'rejected'::public.verification_status end,
    reviewer_id = auth.uid(),
    reviewer_notes = notes,
    reviewed_at = now()
  where id = submission_id
  returning * into sub;

  if approve then
    update public.profiles
    set verification_level = greatest(verification_level, sub.target_level)
    where id = sub.user_id;

    if sub.target_level >= 3 then
      update public.merchants
      set status = 'approved'
      where owner_id = sub.user_id and status in ('draft', 'pending');
    end if;
  end if;

  return sub;
end;
$$;

-- place order RPC
create or replace function public.place_order(
  p_merchant_id uuid,
  p_address_id uuid,
  p_delivery_type public.delivery_type,
  p_payment_method public.payment_method,
  p_items jsonb,
  p_notes text default null,
  p_scheduled_for timestamptz default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_merchant public.merchants;
  v_address public.addresses;
  v_rule public.delivery_fee_rules;
  v_subtotal numeric(12,2) := 0;
  v_distance numeric(8,2) := 0;
  v_delivery_fee numeric(12,2) := 0;
  v_cod_fee numeric(12,2) := 0;
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_billable_km numeric(8,2);
  v_base numeric(12,2);
begin
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile is null or v_profile.role <> 'customer' then
    raise exception 'customer account required';
  end if;
  if v_profile.verification_level < 2 then
    raise exception 'verification level 2 required to place orders';
  end if;

  select * into v_merchant from public.merchants
  where id = p_merchant_id and status = 'approved' and is_open = true;
  if v_merchant is null then
    raise exception 'merchant unavailable';
  end if;

  select * into v_address from public.addresses
  where id = p_address_id and user_id = auth.uid();
  if v_address is null then
    raise exception 'address not found';
  end if;

  select * into v_rule from public.delivery_fee_rules
  where is_active = true
    and (service_area_code = v_merchant.service_area_code or service_area_code is null)
  order by service_area_code nulls last
  limit 1;

  if v_rule is null then
    raise exception 'no fee rule configured';
  end if;

  -- haversine km
  v_distance := (
    6371 * acos(
      least(1::float, greatest(-1::float,
        cos(radians(v_merchant.lat)) * cos(radians(v_address.lat)) *
        cos(radians(v_address.lng) - radians(v_merchant.lng)) +
        sin(radians(v_merchant.lat)) * sin(radians(v_address.lat))
      ))
    )
  )::numeric(8,2);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products
    where id = (v_item->>'productId')::uuid
      and merchant_id = p_merchant_id
      and is_available = true;
    if v_product is null then
      raise exception 'product unavailable';
    end if;
    v_subtotal := v_subtotal + (v_product.price * (v_item->>'quantity')::int);
  end loop;

  v_billable_km := greatest(0, v_distance - v_rule.free_km);
  v_base := v_rule.base_fee + (v_billable_km * v_rule.per_km_fee);
  if p_delivery_type = 'express' then
    v_base := v_base * v_rule.express_multiplier;
  elsif p_delivery_type = 'scheduled' then
    v_base := v_base + v_rule.scheduled_surcharge;
  end if;
  if p_payment_method = 'cod' then
    v_cod_fee := v_rule.cod_handling_fee;
  end if;
  v_delivery_fee := round(v_base, 2);

  insert into public.orders (
    order_number, customer_id, merchant_id, address_id, status, delivery_type,
    payment_method, scheduled_for, subtotal, delivery_fee, cod_fee, distance_km, notes
  ) values (
    public.generate_order_number(), auth.uid(), p_merchant_id, p_address_id, 'pending',
    p_delivery_type, p_payment_method, p_scheduled_for, v_subtotal, v_delivery_fee, v_cod_fee,
    v_distance, p_notes
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = (v_item->>'productId')::uuid;
    insert into public.order_items (order_id, product_id, name, unit_price, quantity)
    values (
      v_order.id, v_product.id, v_product.name, v_product.price, (v_item->>'quantity')::int
    );
  end loop;

  insert into public.deliveries (
    order_id, status, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, rider_earning
  ) values (
    v_order.id, 'awaiting_rider', v_merchant.lat, v_merchant.lng,
    v_address.lat, v_address.lng, round(v_delivery_fee * 0.8, 2)
  );

  insert into public.payments (order_id, kind, amount, method, status, payee) values
    (v_order.id, 'product', v_subtotal, p_payment_method, 'pending', 'merchant'),
    (v_order.id, 'delivery', v_delivery_fee, p_payment_method, 'pending', 'platform');

  if v_cod_fee > 0 then
    insert into public.payments (order_id, kind, amount, method, status, payee)
    values (v_order.id, 'cod_fee', v_cod_fee, 'cod', 'pending', 'platform');
  end if;

  return v_order;
end;
$$;

create or replace function public.accept_delivery(p_delivery_id uuid)
returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.deliveries;
  p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.role <> 'rider' or p.verification_level < 4 then
    raise exception 'verified rider required';
  end if;

  update public.deliveries
  set rider_id = auth.uid(), status = 'assigned', assigned_at = now()
  where id = p_delivery_id and status = 'awaiting_rider' and rider_id is null
  returning * into d;

  if d is null then
    raise exception 'delivery unavailable';
  end if;
  return d;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.service_areas enable row level security;
alter table public.addresses enable row level security;
alter table public.verification_submissions enable row level security;
alter table public.merchants enable row level security;
alter table public.merchant_documents enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.delivery_fee_rules enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.deliveries enable row level security;
alter table public.payments enable row level security;
alter table public.ratings enable row level security;
alter table public.rider_presence enable row level security;

create policy "profiles read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin() or true);

create policy "profiles update own"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

create policy "service areas public read"
  on public.service_areas for select using (true);

create policy "addresses own"
  on public.addresses for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "verification own insert/select"
  on public.verification_submissions for select
  using (user_id = auth.uid() or public.is_admin());

create policy "verification own insert"
  on public.verification_submissions for insert
  with check (user_id = auth.uid());

create policy "verification admin update"
  on public.verification_submissions for update
  using (public.is_admin());

create policy "merchants public approved read"
  on public.merchants for select
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());

create policy "merchants owner write"
  on public.merchants for insert
  with check (owner_id = auth.uid() or public.is_admin());

create policy "merchants owner update"
  on public.merchants for update
  using (owner_id = auth.uid() or public.is_admin());

create policy "merchant docs owner/admin"
  on public.merchant_documents for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.merchants m
      where m.id = merchant_id and m.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.merchants m
      where m.id = merchant_id and m.owner_id = auth.uid()
    )
  );

create policy "categories public"
  on public.categories for select using (true);

create policy "products public available"
  on public.products for select
  using (
    is_available = true
    or exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid())
    or public.is_admin()
  );

create policy "products merchant write"
  on public.products for all
  using (
    public.is_admin()
    or exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid())
  );

create policy "fee rules read"
  on public.delivery_fee_rules for select using (true);

create policy "fee rules admin write"
  on public.delivery_fee_rules for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "orders participant read"
  on public.orders for select
  using (
    customer_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid())
    or exists (select 1 from public.deliveries d where d.order_id = id and d.rider_id = auth.uid())
  );

create policy "orders customer insert blocked direct"
  on public.orders for insert
  with check (false);

create policy "orders merchant/admin update"
  on public.orders for update
  using (
    public.is_admin()
    or exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid())
    or customer_id = auth.uid()
  );

create policy "order items via order"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or public.is_admin()
          or exists (select 1 from public.merchants m where m.id = o.merchant_id and m.owner_id = auth.uid())
          or exists (select 1 from public.deliveries d where d.order_id = o.id and d.rider_id = auth.uid())
        )
    )
  );

create policy "deliveries participant"
  on public.deliveries for select
  using (
    public.is_admin()
    or rider_id = auth.uid()
    or status = 'awaiting_rider'
    or exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or exists (select 1 from public.merchants m where m.id = o.merchant_id and m.owner_id = auth.uid())
        )
    )
  );

create policy "deliveries rider/admin update"
  on public.deliveries for update
  using (public.is_admin() or rider_id = auth.uid() or status = 'awaiting_rider');

create policy "payments participant read"
  on public.payments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or exists (select 1 from public.merchants m where m.id = o.merchant_id and m.owner_id = auth.uid())
          or exists (select 1 from public.deliveries d where d.order_id = o.id and d.rider_id = auth.uid())
        )
    )
  );

create policy "ratings read"
  on public.ratings for select using (true);

create policy "ratings insert own"
  on public.ratings for insert
  with check (rater_id = auth.uid());

create policy "rider presence"
  on public.rider_presence for all
  using (rider_id = auth.uid() or public.is_admin())
  with check (rider_id = auth.uid() or public.is_admin());

-- storage buckets (paths managed by apps)
insert into storage.buckets (id, name, public) values
  ('ids', 'ids', false),
  ('selfies', 'selfies', false),
  ('merchant-docs', 'merchant-docs', false),
  ('delivery-proofs', 'delivery-proofs', false)
on conflict (id) do nothing;

create policy "storage own folder read"
  on storage.objects for select
  using (
    bucket_id in ('ids', 'selfies', 'merchant-docs', 'delivery-proofs')
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "storage own folder write"
  on storage.objects for insert
  with check (
    bucket_id in ('ids', 'selfies', 'merchant-docs', 'delivery-proofs')
    and auth.uid()::text = (storage.foldername(name))[1]
  );
