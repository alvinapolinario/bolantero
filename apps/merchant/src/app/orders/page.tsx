"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Order = Tables<"orders">;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [merchantId, setMerchantId] = useState<string | null>(null);

  async function load(id: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("merchant_id", id)
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
  }

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!merchant) return;
      setMerchantId(merchant.id);
      await load(merchant.id);

      const channel = supabase
        .channel("merchant-orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `merchant_id=eq.${merchant.id}`,
          },
          () => load(merchant.id),
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, []);

  async function updateStatus(order: Order, status: Order["status"]) {
    const supabase = createClient();
    await supabase.from("orders").update({ status }).eq("id", order.id);
    if (merchantId) await load(merchantId);
  }

  return (
    <Shell title="Orders">
      <section className="card">
        {orders.length === 0 ? (
          <p className="muted">No orders yet. New orders appear here in realtime.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {orders.map((order) => (
              <article
                key={order.id}
                style={{ borderBottom: "1px solid var(--bol-line)", paddingBottom: 12 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{order.order_number}</strong>
                    <p className="muted" style={{ margin: "4px 0" }}>
                      Status: {order.status} · {order.delivery_type}
                    </p>
                    <p className="muted" style={{ margin: 0 }}>
                      Merchant sales ₱{Number(order.subtotal).toFixed(2)} (100% yours) · Delivery fee ₱
                      {Number(order.delivery_fee).toFixed(2)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {order.status === "pending" ? (
                      <>
                        <button className="btn" type="button" onClick={() => updateStatus(order, "confirmed")}>
                          Confirm
                        </button>
                        <button
                          className="btn danger"
                          type="button"
                          onClick={() => updateStatus(order, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    {order.status === "confirmed" ? (
                      <button className="btn" type="button" onClick={() => updateStatus(order, "preparing")}>
                        Preparing
                      </button>
                    ) : null}
                    {order.status === "preparing" ? (
                      <button className="btn" type="button" onClick={() => updateStatus(order, "ready")}>
                        Ready for pickup
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
