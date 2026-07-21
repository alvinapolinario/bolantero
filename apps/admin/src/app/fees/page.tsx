"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type FeeRule = Tables<"delivery_fee_rules">;

export default function FeesPage() {
  const [rules, setRules] = useState<FeeRule[]>([]);
  const [baseFee, setBaseFee] = useState("49");
  const [perKm, setPerKm] = useState("10");
  const [freeKm, setFreeKm] = useState("2");
  const [express, setExpress] = useState("1.5");
  const [scheduled, setScheduled] = useState("15");
  const [cod, setCod] = useState("10");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("delivery_fee_rules")
      .select("*")
      .order("created_at", { ascending: false });
    setRules(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("delivery_fee_rules").insert({
      name: `Rule ${new Date().toLocaleDateString()}`,
      base_fee: Number(baseFee),
      per_km_fee: Number(perKm),
      free_km: Number(freeKm),
      express_multiplier: Number(express),
      scheduled_surcharge: Number(scheduled),
      cod_handling_fee: Number(cod),
      is_active: true,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Fee rule saved. No merchant commissions exist in this system.");
    await load();
  }

  async function activate(id: string) {
    const supabase = createClient();
    await supabase.from("delivery_fee_rules").update({ is_active: false }).neq("id", id);
    await supabase.from("delivery_fee_rules").update({ is_active: true }).eq("id", id);
    await load();
  }

  return (
    <Shell title="Delivery fee configuration">
      <div className="grid-2">
        <form className="card" onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
          <h2 style={{ marginTop: 0 }}>New fee rule</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Platform revenue = delivery fees only.
          </p>
          {[
            ["Base fee", baseFee, setBaseFee],
            ["Free km", freeKm, setFreeKm],
            ["Per km", perKm, setPerKm],
            ["Express multiplier", express, setExpress],
            ["Scheduled surcharge", scheduled, setScheduled],
            ["COD handling fee", cod, setCod],
          ].map(([label, value, setter]) => (
            <div key={String(label)}>
              <label className="label">{label as string}</label>
              <input
                className="input"
                value={value as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              />
            </div>
          ))}
          <button className="btn" type="submit">
            Save rule
          </button>
          {message ? <p className="muted">{message}</p> : null}
        </form>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Active rules</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {rules.map((rule) => (
              <article key={rule.id} style={{ borderTop: "1px solid var(--bol-line)", paddingTop: 12 }}>
                <strong>
                  {rule.name} {rule.is_active ? <span className="badge">active</span> : null}
                </strong>
                <p className="muted">
                  Base ₱{Number(rule.base_fee).toFixed(2)} · {Number(rule.free_km)} km free · ₱
                  {Number(rule.per_km_fee).toFixed(2)}/km
                </p>
                {!rule.is_active ? (
                  <button className="btn secondary" type="button" onClick={() => activate(rule.id)}>
                    Make active
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
