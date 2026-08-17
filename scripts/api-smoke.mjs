/**
 * Live API smoke against local Supabase RPCs.
 * Requires db:start, db:reset, copied keys in .env, and pnpm seed.
 *
 *   node --env-file=.env scripts/api-smoke.mjs
 *
 * Covers TC-08, TC-09, TC-10, TC-11 (API only).
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service || anon.includes("your-anon")) {
  console.error("Set SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const pickup = {
  label: "City Hall",
  line1: "National Highway",
  barangay: "Poblacion",
  city: "Tacurong City",
  lat: 6.6925,
  lng: 124.8472,
};
const dropoff = {
  label: "Public Market",
  line1: "Bonifacio Street",
  barangay: "Poblacion",
  city: "Tacurong City",
  lat: 6.695,
  lng: 124.85,
};

let failed = 0;

function pass(id, detail) {
  console.log(`PASS ${id} ${detail}`);
}

function fail(id, detail) {
  failed += 1;
  console.error(`FAIL ${id} ${detail}`);
}

async function signIn(email) {
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: "password123",
  });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return client;
}

function tripArgs(extra = {}) {
  return {
    p_service_type: extra.serviceType ?? "ride",
    p_service_area_code: "tacurong",
    p_pickup_label: pickup.label,
    p_pickup_line1: pickup.line1,
    p_pickup_barangay: pickup.barangay,
    p_pickup_city: pickup.city,
    p_pickup_lat: pickup.lat,
    p_pickup_lng: pickup.lng,
    p_dropoff_label: dropoff.label,
    p_dropoff_line1: dropoff.line1,
    p_dropoff_barangay: dropoff.barangay,
    p_dropoff_city: dropoff.city,
    p_dropoff_lat: dropoff.lat,
    p_dropoff_lng: dropoff.lng,
    p_payment_method: "cod",
    p_parcel_size: extra.parcelSize ?? null,
    p_parcel_description: extra.parcelDescription ?? null,
    p_recipient_name: extra.recipientName ?? null,
    p_recipient_phone: extra.recipientPhone ?? null,
    p_notes: extra.notes ?? null,
  };
}

async function ensureUnverifiedCustomer() {
  const email = "unverified@bolantero.local";
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  let user = listed?.users?.find((u) => u.email === email);
  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password: "password123",
      email_confirm: true,
      user_metadata: { role: "customer", display_name: "Unverified" },
    });
    if (created.error) throw created.error;
    user = created.data.user;
  }
  await admin.from("profiles").upsert({
    id: user.id,
    role: "customer",
    display_name: "Unverified",
    verification_level: 1,
  });
  return email;
}

async function main() {
  const customer = await signIn("customer@bolantero.local");
  const rider = await signIn("rider@bolantero.local");

  const { data: quote, error: quoteError } = await customer.rpc("quote_trip", {
    p_service_type: "ride",
    p_service_area_code: "tacurong",
    p_pickup_lat: pickup.lat,
    p_pickup_lng: pickup.lng,
    p_dropoff_lat: dropoff.lat,
    p_dropoff_lng: dropoff.lng,
    p_parcel_size: null,
  });
  if (quoteError) {
    fail("TC-09", `quote_trip: ${quoteError.message}`);
  } else {
    const fare = Number(quote.fare);
    const split = Number(quote.platformFee) + Number(quote.riderEarning);
    if (Math.abs(fare - split) > 0.001) {
      fail("TC-09", `fare split ${fare} != ${split}`);
    } else {
      pass("TC-09", `quote_trip fare ${fare}`);
    }
  }

  const { data: trip, error: requestError } = await customer.rpc(
    "request_trip",
    tripArgs(),
  );
  if (requestError) {
    fail("TC-09", `request_trip: ${requestError.message}`);
  } else {
    const { data: pays } = await customer
      .from("trip_payments")
      .select("payee, kind")
      .eq("trip_id", trip.id);
    const payees = new Set((pays ?? []).map((p) => p.payee));
    if (payees.has("merchant")) {
      fail("TC-09", "trip_payments includes merchant");
    } else {
      pass("TC-09", `request_trip ${trip.trip_number} payees=${[...payees].join(",")}`);
    }
  }

  const { error: padalaError } = await customer.rpc(
    "request_trip",
    tripArgs({ serviceType: "courier" }),
  );
  if (!padalaError) {
    fail("TC-10", "padala without recipient/item was accepted");
  } else {
    pass("TC-10", padalaError.message);
  }

  const unverifiedEmail = await ensureUnverifiedCustomer();
  const unverified = await signIn(unverifiedEmail);
  const { error: unvError } = await unverified.rpc("request_trip", tripArgs());
  if (!unvError) {
    fail("TC-08", "unverified customer was allowed to request_trip");
  } else {
    pass("TC-08", unvError.message);
  }

  if (trip?.id) {
    const { error: acceptError } = await rider.rpc("accept_trip", {
      p_trip_id: trip.id,
    });
    if (acceptError) {
      fail("TC-11", `accept_trip: ${acceptError.message}`);
    } else {
      for (const status of ["arrived_pickup", "in_progress", "completed"]) {
        const { error: advError } = await rider.rpc("advance_trip", {
          p_trip_id: trip.id,
          p_to_status: status,
        });
        if (advError) {
          fail("TC-11", `advance_trip ${status}: ${advError.message}`);
          break;
        }
      }
      const { data: done } = await rider
        .from("trips")
        .select("status, rider_earning")
        .eq("id", trip.id)
        .single();
      if (done?.status === "completed" && Number(done.rider_earning) > 0) {
        pass("TC-11", `ride completed earning ${done.rider_earning}`);
      } else if (done?.status === "completed") {
        fail("TC-11", "completed but rider_earning is 0");
      }
    }
  }

  const { data: merchants } = await customer
    .from("merchants")
    .select("id")
    .eq("status", "approved")
    .limit(1);
  const { data: products } = await customer
    .from("products")
    .select("id")
    .eq("merchant_id", merchants?.[0]?.id ?? "")
    .limit(1);
  const {
    data: { user },
  } = await customer.auth.getUser();
  const { data: address } = await customer
    .from("addresses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (merchants?.[0] && products?.[0] && address) {
    const { error: orderError } = await customer.rpc("place_order", {
      p_merchant_id: merchants[0].id,
      p_address_id: address.id,
      p_delivery_type: "immediate",
      p_payment_method: "cod",
      p_items: [{ productId: products[0].id, quantity: 1 }],
      p_notes: null,
      p_scheduled_for: null,
    });
    if (orderError) fail("TC-11", `place_order still: ${orderError.message}`);
    else pass("TC-11", "place_order still works after ride");
  } else {
    fail("TC-11", "missing seeded merchant/product/address for place_order");
  }

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAPI smoke passed (TC-08…TC-11)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
