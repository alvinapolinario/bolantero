// Optional edge wrapper around public.place_order RPC.
// Prefer calling the RPC directly from apps; this function is a future extension point
// for payment intent creation / fraud checks.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const body = await req.json();
  const { data, error } = await supabase.rpc("place_order", body);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  return new Response(JSON.stringify({ order: data }), {
    headers: { "Content-Type": "application/json" },
  });
});
