"use client";

import { FormEvent, useEffect, useState } from "react";
import { FOOD_CATEGORIES } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Product = Tables<"products">;

export default function ProductsPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("99");
  const [category, setCategory] = useState("restaurant");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!merchant) {
      setMessage("Create your business profile first.");
      return;
    }
    setMerchantId(merchant.id);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });
    setProducts(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!merchantId) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").insert({
      merchant_id: merchantId,
      name,
      price: Number(price),
      category_slug: category,
      description,
      is_available: true,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setName("");
    setDescription("");
    await load();
  }

  async function toggleAvailability(product: Product) {
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ is_available: !product.is_available })
      .eq("id", product.id);
    await load();
  }

  return (
    <Shell title="Products">
      <div className="grid-2">
        <form className="card" onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
          <h2 style={{ marginTop: 0 }}>Add item</h2>
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Price (PHP)</label>
            <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
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
            <label className="label">Description</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <button className="btn" type="submit">
            Save product
          </button>
          {message ? <p className="muted">{message}</p> : null}
        </form>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Menu</h2>
          {products.length === 0 ? (
            <p className="muted">No products yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    borderTop: "1px solid var(--bol-line)",
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>{product.name}</strong>
                    <p className="muted" style={{ margin: "4px 0" }}>
                      ₱{Number(product.price).toFixed(2)} · {product.category_slug}
                    </p>
                    <p className="muted" style={{ margin: 0 }}>
                      {product.is_available ? "Available" : "Hidden"}
                    </p>
                  </div>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => toggleAvailability(product)}
                  >
                    Toggle
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
