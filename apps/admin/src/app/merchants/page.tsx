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
    <Shell title="Merchant approvals">
      <section className="card">
        <table className="table">
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
                <td>
                  <strong>{m.name}</strong>
                  <div className="muted">{m.category_slug}</div>
                </td>
                <td>{m.service_area_code}</td>
                <td>
                  <span className="badge">{m.status}</span>
                </td>
                <td style={{ display: "flex", gap: 8 }}>
                  {m.status !== "approved" ? (
                    <button className="btn" type="button" onClick={() => setStatus(m.id, "approved")}>
                      Approve
                    </button>
                  ) : null}
                  {m.status !== "suspended" ? (
                    <button className="btn secondary" type="button" onClick={() => setStatus(m.id, "suspended")}>
                      Suspend
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
