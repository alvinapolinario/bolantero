"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Merchant = Tables<"merchants">;

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("merchants")
      .select("*")
      .order("created_at", { ascending: false });
    setMerchants(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: Merchant["status"]) {
    const supabase = createClient();
    await supabase.from("merchants").update({ status }).eq("id", id);
    await load();
  }

  return (
    <Shell title="Merchants" lede="Approve stores to sell. Product revenue stays with the merchant.">
      <section className="card">
        <div className="card-header">All merchants</div>
        {merchants.length === 0 ? (
          <p className="empty">No merchants yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table compact">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr key={m.id}>
                    <td data-label="Business">
                      <strong>{m.name}</strong>
                      <div className="muted">{m.category_slug}</div>
                    </td>
                    <td data-label="Area">{m.service_area_code}</td>
                    <td data-label="Status">
                      <span className="badge">{m.status}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {m.status !== "approved" ? (
                          <button className="btn" type="button" onClick={() => setStatus(m.id, "approved")}>
                            Approve
                          </button>
                        ) : null}
                        {m.status !== "suspended" ? (
                          <button
                            className="btn secondary"
                            type="button"
                            onClick={() => setStatus(m.id, "suspended")}
                          >
                            Suspend
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  );
}
