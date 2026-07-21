"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Submission = Tables<"verification_submissions"> & {
  profiles?: { display_name: string | null; phone: string | null; role: string } | null;
};

export default function VerificationsPage() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("verification_submissions")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true });
    if (error) {
      setMessage(error.message);
      return;
    }

    const rowsWithProfiles: Submission[] = [];
    for (const row of data ?? []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, phone, role")
        .eq("id", row.user_id)
        .maybeSingle();
      rowsWithProfiles.push({ ...row, profiles: profile });
    }
    setRows(rowsWithProfiles);
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: string, approve: boolean) {
    const supabase = createClient();
    const { error } = await supabase.rpc("review_verification", {
      submission_id: id,
      approve,
      notes: approve ? "Approved by admin" : "Rejected by admin",
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(approve ? "Approved and badge granted." : "Submission rejected.");
    await load();
  }

  return (
    <Shell title="Identity verification queue">
      {message ? <p className="card">{message}</p> : null}
      <section className="card">
        {rows.length === 0 ? (
          <p className="muted">No pending verification submissions.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Target level</th>
                <th>ID</th>
                <th>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.profiles?.display_name ?? "User"}</strong>
                    <div className="muted">
                      {row.profiles?.role} · {row.profiles?.phone}
                    </div>
                  </td>
                  <td>Level {row.target_level}</td>
                  <td>
                    {row.id_type ?? "—"}
                    <div className="muted">{row.id_number ?? ""}</div>
                  </td>
                  <td>{new Date(row.submitted_at).toLocaleString()}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button className="btn" type="button" onClick={() => review(row.id, true)}>
                      Approve
                    </button>
                    <button className="btn danger" type="button" onClick={() => review(row.id, false)}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Shell>
  );
}
