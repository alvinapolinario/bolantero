"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Tables } from "@bolantero/database";
import { tripServiceLabel, type TripServiceType } from "@bolantero/shared";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type FeeRule = Tables<"delivery_fee_rules">;
type TripRule = Tables<"trip_fare_rules">;

export default function FeesPage() {
  const [rules, setRules] = useState<FeeRule[]>([]);
  const [tripRules, setTripRules] = useState<TripRule[]>([]);
  const [baseFee, setBaseFee] = useState("49");
  const [perKm, setPerKm] = useState("10");
  const [freeKm, setFreeKm] = useState("2");
  const [express, setExpress] = useState("1.5");
  const [scheduled, setScheduled] = useState("15");
  const [cod, setCod] = useState("10");
  const [tripService, setTripService] = useState<TripServiceType>("ride");
  const [tripBase, setTripBase] = useState("40");
  const [tripFree, setTripFree] = useState("1");
  const [tripPerKm, setTripPerKm] = useState("12");
  const [tripMedium, setTripMedium] = useState("15");
  const [tripLarge, setTripLarge] = useState("30");
  const [tripBps, setTripBps] = useState("2000");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const [{ data: food }, { data: trips }] = await Promise.all([
      supabase.from("delivery_fee_rules").select("*").order("created_at", { ascending: false }),
      supabase.from("trip_fare_rules").select("*").order("created_at", { ascending: false }),
    ]);
    setRules(food ?? []);
    setTripRules(trips ?? []);
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
    setMessage("Food fee rule saved. No merchant commissions exist in this system.");
    await load();
  }

  async function onCreateTrip(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("trip_fare_rules").insert({
      name: `${tripServiceLabel(tripService)} ${new Date().toLocaleDateString()}`,
      service_type: tripService,
      base_fee: Number(tripBase),
      free_km: Number(tripFree),
      per_km_fee: Number(tripPerKm),
      small_surcharge: 0,
      medium_surcharge: Number(tripMedium),
      large_surcharge: Number(tripLarge),
      platform_fee_bps: Number(tripBps),
      is_active: true,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Trip fare rule saved. Fare is platform-priced; no merchant payee.");
    await load();
  }

  async function activate(id: string) {
    const supabase = createClient();
    await supabase.from("delivery_fee_rules").update({ is_active: false }).neq("id", id);
    await supabase.from("delivery_fee_rules").update({ is_active: true }).eq("id", id);
    await load();
  }

  async function activateTrip(rule: TripRule) {
    const supabase = createClient();
    await supabase
      .from("trip_fare_rules")
      .update({ is_active: false })
      .eq("service_type", rule.service_type);
    await supabase.from("trip_fare_rules").update({ is_active: true }).eq("id", rule.id);
    await load();
  }

  return (
    <Shell title="Fee rules" lede="Food delivery fees and Ride/Padala fare rules. Never a merchant sales commission.">
      <div className="stack-page">
      {message ? <p className="alert">{message}</p> : null}
      <div className="grid-2">
        <form className="card" onSubmit={onCreate}>
          <div className="card-header">New food delivery rule</div>
          <div className="card-body" style={{ display: "grid", gap: 12 }}>
          <p className="muted" style={{ margin: 0 }}>
            Food platform revenue = delivery + COD fees only.
          </p>
          <div className="field-grid">
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
                inputMode="decimal"
                value={value as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              />
            </div>
          ))}
          </div>
          <button className="btn" type="submit">
            Save food rule
          </button>
          </div>
        </form>

        <section className="card">
          <div className="card-header">Food rules</div>
          <div className="card-body" style={{ display: "grid", gap: 12 }}>
            {rules.length === 0 ? <p className="muted" style={{ margin: 0 }}>No food rules yet.</p> : null}
            {rules.map((rule) => (
              <article key={rule.id} style={{ borderTop: "1px solid var(--lte-line)", paddingTop: 12 }}>
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

      <div className="grid-2">
        <form className="card" onSubmit={onCreateTrip}>
          <div className="card-header">New Ride / Padala rule</div>
          <div className="card-body" style={{ display: "grid", gap: 12 }}>
          <p className="muted" style={{ margin: 0 }}>
            Trip fare = platform fee + rider earning. Never a merchant payee.
          </p>
          <label className="label">Service</label>
          <select
            className="input"
            value={tripService}
            onChange={(e) => setTripService(e.target.value as TripServiceType)}
          >
            <option value="ride">Ride</option>
            <option value="courier">Padala</option>
          </select>
          <div className="field-grid">
          {[
            ["Base fee", tripBase, setTripBase],
            ["Free km", tripFree, setTripFree],
            ["Per km", tripPerKm, setTripPerKm],
            ["Medium surcharge", tripMedium, setTripMedium],
            ["Large surcharge", tripLarge, setTripLarge],
            ["Platform fee bps", tripBps, setTripBps],
          ].map(([label, value, setter]) => (
            <div key={String(label)}>
              <label className="label">{label as string}</label>
              <input
                className="input"
                inputMode="decimal"
                value={value as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              />
            </div>
          ))}
          </div>
          <button className="btn" type="submit">
            Save trip rule
          </button>
          </div>
        </form>

        <section className="card">
          <div className="card-header">Trip rules</div>
          <div className="card-body" style={{ display: "grid", gap: 12 }}>
            {tripRules.length === 0 ? <p className="muted" style={{ margin: 0 }}>No trip rules yet.</p> : null}
            {tripRules.map((rule) => (
              <article key={rule.id} style={{ borderTop: "1px solid var(--lte-line)", paddingTop: 12 }}>
                <strong>
                  {rule.name} · {tripServiceLabel(rule.service_type)}{" "}
                  {rule.is_active ? <span className="badge">active</span> : null}
                </strong>
                <p className="muted">
                  Base ₱{Number(rule.base_fee).toFixed(2)} · {Number(rule.free_km)} km free · ₱
                  {Number(rule.per_km_fee).toFixed(2)}/km · {rule.platform_fee_bps} bps
                </p>
                {!rule.is_active ? (
                  <button className="btn secondary" type="button" onClick={() => activateTrip(rule)}>
                    Make active
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
      </div>
    </Shell>
  );
}
