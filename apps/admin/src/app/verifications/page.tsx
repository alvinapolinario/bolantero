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
    <Shell title="Verifications" lede="Approve or reject pending identity submissions.">
      {message ? <p className="alert">{message}</p> : null}
      <section className="card">
        <div className="card-header">Pending submissions</div>
        {rows.length === 0 ? (
          <p className="empty">No pending verification submissions.</p>
        ) : (
          <div className="table-wrap">
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
                    <td data-label="User">
                      <strong>{row.profiles?.display_name ?? "User"}</strong>
                      <div className="muted">
                        {row.profiles?.role} · {row.profiles?.phone}
                      </div>
                    </td>
                    <td data-label="Target">Level {row.target_level}</td>
                    <td data-label="ID">
                      {row.id_type ?? "—"}
                      <div className="muted">{row.id_number ?? ""}</div>
                    </td>
                    <td data-label="Submitted">{new Date(row.submitted_at).toLocaleString()}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn" type="button" onClick={() => review(row.id, true)}>
                          Approve
                        </button>
                        <button className="btn danger" type="button" onClick={() => review(row.id, false)}>
                          Reject
                        </button>
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
