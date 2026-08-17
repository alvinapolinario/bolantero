/**
 * Seeds demo auth users + launch-area merchants/products.
 * Requires local Supabase with service role key.
 *
 * Usage:
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/seed-demo.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const users = [
  {
    email: "admin@bolantero.local",
    password: "password123",
    role: "admin",
    name: "Bolantero Admin",
    level: 4,
  },
  {
    email: "customer@bolantero.local",
    password: "password123",
    role: "customer",
    name: "Demo Customer",
    level: 2,
  },
  {
    email: "merchant@bolantero.local",
    password: "password123",
    role: "merchant",
    name: "Demo Merchant Owner",
    level: 3,
  },
  {
    email: "rider@bolantero.local",
    password: "password123",
    role: "rider",
    name: "Demo Rider",
    level: 4,
  },
];

const merchantDefs = [
  {
    name: "Tacurong Tapsilog House",
    slug: "tacurong-tapsilog-house",
    category_slug: "restaurant",
    service_area_code: "tacurong",
    address_line: "National Highway, Tacurong City",
    lat: 6.6925,
    lng: 124.8472,
    products: [
      { name: "Tapsilog", price: 99, category_slug: "restaurant" },
      { name: "Tocilog", price: 99, category_slug: "restaurant" },
      { name: "Iced Tea", price: 35, category_slug: "restaurant" },
    ],
  },
  {
    name: "Lambayong Bakery Corner",
    slug: "lambayong-bakery-corner",
    category_slug: "bakery",
    service_area_code: "lambayong",
    address_line: "Poblacion, Lambayong",
    lat: 6.7889,
    lng: 124.6333,
    products: [
      { name: "Pandesal Pack", price: 45, category_slug: "bakery" },
      { name: "Cheese Roll", price: 25, category_slug: "bakery" },
    ],
  },
  {
    name: "Isulan Brew Co.",
    slug: "isulan-brew-co",
    category_slug: "coffee",
    service_area_code: "isulan",
    address_line: "Provincial Road, Isulan",
    lat: 6.6294,
    lng: 124.605,
    products: [
      { name: "Americano", price: 80, category_slug: "coffee" },
      { name: "Caramel Latte", price: 120, category_slug: "coffee" },
    ],
  },
];

async function ensureUser(user) {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = listed?.users?.find((u) => u.email === user.email);
  if (existing) {
    await admin.from("profiles").upsert({
      id: existing.id,
      role: user.role,
      display_name: user.name,
      verification_level: user.level,
    });
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { role: user.role, display_name: user.name },
  });
  if (error) throw error;
  await admin.from("profiles").upsert({
    id: data.user.id,
    role: user.role,
    display_name: user.name,
    verification_level: user.level,
  });
  return data.user.id;
}

async function main() {
  const ids = {};
  for (const user of users) {
    ids[user.role] = await ensureUser(user);
    console.log(`✓ ${user.role}: ${user.email}`);
  }

  for (const def of merchantDefs) {
    const { data: merchant, error } = await admin
      .from("merchants")
      .upsert(
        {
          owner_id: ids.merchant,
          name: def.name,
          slug: def.slug,
          category_slug: def.category_slug,
          service_area_code: def.service_area_code,
          address_line: def.address_line,
          lat: def.lat,
          lng: def.lng,
          status: "approved",
          is_open: true,
          opens_at: "08:00",
          closes_at: "21:00",
          description: "Phase 1 food partner",
        },
        { onConflict: "slug" },
      )
      .select("*")
      .single();
    if (error) throw error;

    await admin.from("products").delete().eq("merchant_id", merchant.id);
    const { error: productError } = await admin.from("products").insert(
      def.products.map((p) => ({
        merchant_id: merchant.id,
        name: p.name,
        price: p.price,
        category_slug: p.category_slug,
        is_available: true,
        description: "Seed menu item",
      })),
    );
    if (productError) throw productError;
    console.log(`✓ merchant ${def.name}`);
  }

  await admin.from("addresses").delete().eq("user_id", ids.customer);
  await admin.from("addresses").insert({
    user_id: ids.customer,
    label: "Home",
    line1: "Bonifacio Street",
    barangay: "Poblacion",
    city: "Tacurong City",
    service_area_code: "tacurong",
    lat: 6.695,
    lng: 124.85,
    is_default: true,
  });

  await admin.from("rider_presence").upsert({
    rider_id: ids.rider,
    is_online: true,
    last_lat: 6.6925,
    last_lng: 124.8472,
  });

  await admin.from("trips").delete().eq("trip_number", "TRP-DEMO-RIDE1");
  const { data: demoRide, error: rideError } = await admin
    .from("trips")
    .insert({
      trip_number: "TRP-DEMO-RIDE1",
      customer_id: ids.customer,
      rider_id: ids.rider,
      service_type: "ride",
      service_area_code: "tacurong",
      status: "completed",
      pickup_label: "City Hall",
      pickup_line1: "National Highway",
      pickup_barangay: "Poblacion",
      pickup_city: "Tacurong City",
      pickup_lat: 6.6925,
      pickup_lng: 124.8472,
      dropoff_label: "Public Market",
      dropoff_line1: "Bonifacio Street",
      dropoff_barangay: "Poblacion",
      dropoff_city: "Tacurong City",
      dropoff_lat: 6.695,
      dropoff_lng: 124.85,
      distance_km: 0.4,
      payment_method: "cod",
      fare: 40,
      platform_fee: 8,
      rider_earning: 32,
      size_surcharge: 0,
      completed_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (rideError) throw rideError;
  await admin.from("trip_payments").delete().eq("trip_id", demoRide.id);
  await admin.from("trip_payments").insert([
    {
      trip_id: demoRide.id,
      kind: "platform_fee",
      amount: 8,
      method: "cod",
      status: "pending",
      payee: "platform",
    },
    {
      trip_id: demoRide.id,
      kind: "rider_payout",
      amount: 32,
      method: "cod",
      status: "pending",
      payee: "rider",
    },
  ]);

  await admin.from("trips").delete().eq("trip_number", "TRP-DEMO-PAD1");
  const { data: demoPadala, error: padalaError } = await admin
    .from("trips")
    .insert({
      trip_number: "TRP-DEMO-PAD1",
      customer_id: ids.customer,
      service_type: "courier",
      service_area_code: "tacurong",
      status: "requested",
      pickup_label: "City Hall",
      pickup_line1: "National Highway",
      pickup_barangay: "Poblacion",
      pickup_city: "Tacurong City",
      pickup_lat: 6.6925,
      pickup_lng: 124.8472,
      dropoff_label: "Public Market",
      dropoff_line1: "Bonifacio Street",
      dropoff_barangay: "Poblacion",
      dropoff_city: "Tacurong City",
      dropoff_lat: 6.695,
      dropoff_lng: 124.85,
      distance_km: 0.4,
      payment_method: "cod",
      fare: 49,
      platform_fee: 9.8,
      rider_earning: 39.2,
      size_surcharge: 0,
      parcel_size: "small",
      parcel_description: "Documents",
      recipient_name: "Demo Recipient",
      recipient_phone: "+639171111111",
    })
    .select("*")
    .single();
  if (padalaError) throw padalaError;
  await admin.from("trip_payments").insert([
    {
      trip_id: demoPadala.id,
      kind: "platform_fee",
      amount: 9.8,
      method: "cod",
      status: "pending",
      payee: "platform",
    },
    {
      trip_id: demoPadala.id,
      kind: "rider_payout",
      amount: 39.2,
      method: "cod",
      status: "pending",
      payee: "rider",
    },
  ]);
  console.log("✓ demo ride (completed) + padala (requested)");

  console.log("\nDemo accounts ready (password: password123)");
  console.log("- admin@bolantero.local");
  console.log("- customer@bolantero.local");
  console.log("- merchant@bolantero.local");
  console.log("- rider@bolantero.local");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
