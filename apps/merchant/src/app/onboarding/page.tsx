"use client";

import { FormEvent, useEffect, useState } from "react";
import { FOOD_CATEGORIES, SERVICE_AREAS } from "@bolantero/shared";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [area, setArea] = useState("tacurong");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [opensAt, setOpensAt] = useState("08:00");
  const [closesAt, setClosesAt] = useState("21:00");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setOwnerId(data.user?.id ?? null);
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ownerId) {
      setMessage("Sign in first.");
      return;
    }
    const supabase = createClient();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const centers: Record<string, { lat: number; lng: number }> = {
      tacurong: { lat: 6.6925, lng: 124.8472 },
      lambayong: { lat: 6.7889, lng: 124.6333 },
      isulan: { lat: 6.6294, lng: 124.605 },
    };

    const { error } = await supabase.from("merchants").upsert(
      {
        owner_id: ownerId,
        name,
        slug: `${slug}-${ownerId.slice(0, 6)}`,
        category_slug: category,
        service_area_code: area,
        address_line: address,
        lat: centers[area].lat,
        lng: centers[area].lng,
        phone,
        opens_at: opensAt,
        closes_at: closesAt,
        status: "pending",
      },
      { onConflict: "slug" },
    );

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase.from("profiles").update({ role: "merchant" }).eq("id", ownerId);
    await supabase.from("verification_submissions").insert({
      user_id: ownerId,
      target_level: 3,
      id_type: "Business Permit",
      status: "pending",
    });

    setMessage("Business submitted for admin review.");
  }

  return (
    <Shell title="Business profile">
      <form className="card" onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="label">Store name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid-2">
          <div>
            <label className="label">Category</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Service area</label>
            <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
              {SERVICE_AREAS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="grid-2">
          <div>
            <label className="label">Opens</label>
            <input className="input" type="time" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
          </div>
          <div>
            <label className="label">Closes</label>
            <input className="input" type="time" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          </div>
        </div>
        <button className="btn" type="submit">
          Submit for verification
        </button>
        {message ? <p className="muted">{message}</p> : null}
      </form>
    </Shell>
  );
}
