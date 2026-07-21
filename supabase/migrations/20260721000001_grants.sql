grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to authenticated;

grant execute on function public.place_order(
  uuid, uuid, public.delivery_type, public.payment_method, jsonb, text, timestamptz
) to authenticated;

grant execute on function public.accept_delivery(uuid) to authenticated;

grant execute on function public.review_verification(uuid, boolean, text) to authenticated;

grant execute on function public.generate_order_number() to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.deliveries;
  exception when duplicate_object then null;
  end;
end $$;
