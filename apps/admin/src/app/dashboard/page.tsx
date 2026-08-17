"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Icon, type IconName } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    pendingMerchants: 0,
    activeDeliveries: 0,
    activeTrips: 0,
    ordersToday: 0,
  });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [
        { count: pendingVerifications },
        { count: pendingMerchants },
        { count: activeDeliveries },
        { count: activeTrips },
        { count: ordersToday },
      ] = await Promise.all([
        supabase
          .from("verification_submissions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("merchants")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("deliveries")
          .select("*", { count: "exact", head: true })
          .in("status", ["awaiting_rider", "assigned", "arrived_store", "picked_up"]),
        supabase
          .from("trips")
          .select("*", { count: "exact", head: true })
          .in("status", ["requested", "accepted", "arrived_pickup", "in_progress"]),
        supabase.from("orders").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        pendingVerifications: pendingVerifications ?? 0,
        pendingMerchants: pendingMerchants ?? 0,
        activeDeliveries: activeDeliveries ?? 0,
        activeTrips: activeTrips ?? 0,
        ordersToday: ordersToday ?? 0,
      });
    })();
  }, []);

  const boxes: {
    label: string;
    value: number;
    href: string;
    icon: IconName;
    tone: string;
  }[] = [
    {
      label: "Pending verifications",
      value: stats.pendingVerifications,
      href: "/verifications",
      icon: "verify",
      tone: "bg-primary",
    },
    {
      label: "Merchant approvals",
      value: stats.pendingMerchants,
      href: "/merchants",
      icon: "store",
      tone: "bg-success",
    },
    {
      label: "Live deliveries",
      value: stats.activeDeliveries,
      href: "/deliveries",
      icon: "delivery",
      tone: "bg-warning",
    },
    {
      label: "Live trips",
      value: stats.activeTrips,
      href: "/trips",
      icon: "trip",
      tone: "bg-danger",
    },
    {
      label: "Orders tracked",
      value: stats.ordersToday,
      href: "/deliveries",
      icon: "overview",
      tone: "bg-info",
    },
  ];

  return (
    <Shell title="Overview" lede="Identity, merchants, food jobs, and trips that need attention.">
      <div className="stat-grid">
        {boxes.map((box) => (
          <section key={box.label} className={`small-box ${box.tone}`}>
            <div className="inner">
              <h3>{box.value}</h3>
              <p>{box.label}</p>
            </div>
            <div className="icon">
              <Icon name={box.icon} size={56} />
            </div>
            <Link className="small-box-footer" href={box.href}>
              More info →
            </Link>
          </section>
        ))}
      </div>
    </Shell>
  );
}
