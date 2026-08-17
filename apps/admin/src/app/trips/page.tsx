"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@bolantero/database";
import { tripServiceLabel } from "@bolantero/shared";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Trip = Tables<"trips">;

export default function TripsPage() {
  const [rows, setRows] = useState<Trip[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setRows(data ?? []);
  }

  useEffect(() => {
    const supabase = createClient();
    load();
    const channel = supabase
      .channel("admin-trips")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Shell title="Live trips" lede="Ride and Padala jobs. Fare always splits into platform fee plus rider earning.">
      <section className="card">
        <div className="card-header">Recent trips</div>
        {rows.length === 0 ? (
          <p className="empty">No trips yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Route</th>
                  <th>Fare split</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Trip">
                      <strong>{row.trip_number}</strong>
                      <div className="muted">{row.service_area_code}</div>
                    </td>
                    <td data-label="Service">
                      <span className="badge">{tripServiceLabel(row.service_type)}</span>
                    </td>
                    <td data-label="Status">
                      <span className="badge">{row.status}</span>
                    </td>
                    <td className="muted" data-label="Route">
                      {row.pickup_label} → {row.dropoff_label}
                    </td>
                    <td data-label="Fare split">
                      ₱{Number(row.fare).toFixed(2)}
                      <div className="muted">
                        Platform ₱{Number(row.platform_fee).toFixed(2)} · Rider ₱
                        {Number(row.rider_earning).toFixed(2)}
                      </div>
                    </td>
                    <td className="muted" data-label="Updated">
                      {new Date(row.updated_at).toLocaleString()}
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
