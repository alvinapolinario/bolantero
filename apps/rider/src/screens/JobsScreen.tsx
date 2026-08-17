import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { tripServiceLabel, verifiedBadgeLabel } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Delivery = Tables<"deliveries"> & {
  orders?: {
    order_number: string;
    status: string;
    delivery_fee: number;
    merchant_id?: string;
    merchants?: { name: string; address_line: string } | null;
  } | null;
};

type Trip = Tables<"trips">;
type Filter = "all" | "ride" | "courier" | "food";

type InboxItem =
  | { kind: "food"; id: string; delivery: Delivery }
  | { kind: "trip"; id: string; trip: Trip };

export function JobsScreen({ onOpenEarnings }: { onOpenEarnings: () => void }) {
  const [online, setOnline] = useState(false);
  const [jobs, setJobs] = useState<InboxItem[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  async function enrichDelivery(row: Delivery): Promise<Delivery> {
    const merchantId = row.orders?.merchant_id as string | undefined;
    if (!merchantId) return row;
    const { data: merchant } = await supabase
      .from("merchants")
      .select("name, address_line")
      .eq("id", merchantId)
      .maybeSingle();
    return {
      ...row,
      orders: row.orders ? { ...row.orders, merchants: merchant } : null,
    };
  }

  async function refresh() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_level")
      .eq("id", user.id)
      .maybeSingle();
    setLevel(profile?.verification_level ?? 1);

    const { data: presence } = await supabase
      .from("rider_presence")
      .select("*")
      .eq("rider_id", user.id)
      .maybeSingle();
    setOnline(presence?.is_online ?? false);

    const { data: availableFood } = await supabase
      .from("deliveries")
      .select("*, orders(order_number, status, delivery_fee, merchant_id)")
      .eq("status", "awaiting_rider")
      .order("created_at", { ascending: true });

    const foodItems: InboxItem[] = [];
    for (const row of availableFood ?? []) {
      foodItems.push({
        kind: "food",
        id: row.id,
        delivery: await enrichDelivery(row as Delivery),
      });
    }

    const { data: availableTrips } = await supabase
      .from("trips")
      .select("*")
      .eq("status", "requested")
      .order("created_at", { ascending: true });

    const tripItems: InboxItem[] = (availableTrips ?? []).map((trip) => ({
      kind: "trip" as const,
      id: trip.id,
      trip,
    }));

    setJobs([...tripItems, ...foodItems]);

    const { data: mineFood } = await supabase
      .from("deliveries")
      .select("*, orders(order_number, status, delivery_fee, merchant_id)")
      .eq("rider_id", user.id)
      .in("status", ["assigned", "arrived_store", "picked_up"])
      .maybeSingle();

    if (mineFood) {
      setActiveDelivery(await enrichDelivery(mineFood as Delivery));
    } else {
      setActiveDelivery(null);
    }

    const { data: mineTrip } = await supabase
      .from("trips")
      .select("*")
      .eq("rider_id", user.id)
      .in("status", ["accepted", "arrived_pickup", "in_progress"])
      .maybeSingle();
    setActiveTrip(mineTrip ?? null);
  }

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("rider-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function toggleOnline() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const next = !online;
    await supabase.from("rider_presence").upsert({
      rider_id: user.id,
      is_online: next,
      last_lat: 6.6925,
      last_lng: 124.8472,
    });
    setOnline(next);
  }

  async function acceptFood(jobId: string) {
    const { error } = await supabase.rpc("accept_delivery", {
      p_delivery_id: jobId,
    });
    setMessage(error ? error.message : "Food job accepted.");
    await refresh();
  }

  async function acceptTrip(jobId: string) {
    const { error } = await supabase.rpc("accept_trip", { p_trip_id: jobId });
    setMessage(error ? error.message : "Trip accepted.");
    await refresh();
  }

  async function advanceFood(status: Delivery["status"]) {
    if (!activeDelivery) return;
    const patch: Record<string, unknown> = { status };
    if (status === "picked_up") patch.picked_up_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    await supabase.from("deliveries").update(patch).eq("id", activeDelivery.id);
    if (status === "delivered") {
      await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", activeDelivery.order_id);
    }
    await refresh();
  }

  async function advanceTrip(to: Trip["status"]) {
    if (!activeTrip) return;
    const { error } = await supabase.rpc("advance_trip", {
      p_trip_id: activeTrip.id,
      p_to_status: to,
    });
    setMessage(error ? error.message : `Trip ${to}.`);
    await refresh();
  }

  async function uploadProof() {
    if (!activeDelivery) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const asset = result.assets[0];
    const path = `${user.id}/pod-${Date.now()}.jpg`;
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from("delivery-proofs")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) {
      setMessage(error.message);
      return;
    }
    await supabase
      .from("deliveries")
      .update({ proof_image_path: path })
      .eq("id", activeDelivery.id);
    setMessage("Proof of delivery uploaded.");
    await refresh();
  }

  function openMaps(lat?: number | null, lng?: number | null) {
    if (!lat || !lng) return;
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    );
  }

  const badge = verifiedBadgeLabel(level);
  const filteredJobs = useMemo(
    () =>
      jobs.filter((item) => {
        if (filter === "all") return true;
        if (filter === "food") return item.kind === "food";
        return item.kind === "trip" && item.trip.service_type === filter;
      }),
    [jobs, filter],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rider jobs</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <View style={{ gap: 8, alignItems: "flex-end" }}>
          <Pressable onPress={onOpenEarnings}>
            <Text style={styles.link}>Earnings</Text>
          </Pressable>
          <Pressable style={[styles.toggle, online && styles.toggleOn]} onPress={toggleOnline}>
            <Text style={{ color: online ? "#fff" : theme.colors.ink, fontWeight: "800" }}>
              {online ? "Online" : "Offline"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.row}>
        {(["all", "ride", "courier", "food"] as Filter[]).map((value) => (
          <Pressable
            key={value}
            style={[styles.chip, filter === value && styles.chipActive]}
            onPress={() => setFilter(value)}
          >
            <Text style={{ color: filter === value ? "#fff" : theme.colors.ink, fontWeight: "700" }}>
              {value === "courier" ? "Padala" : value === "ride" ? "Ride" : value === "food" ? "Food" : "All"}
            </Text>
          </Pressable>
        ))}
      </View>

      {message ? <Text style={styles.sub}>{message}</Text> : null}

      {activeTrip ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Active {tripServiceLabel(activeTrip.service_type)}
          </Text>
          <Text style={styles.sub}>{activeTrip.trip_number}</Text>
          <Text style={styles.sub}>
            {activeTrip.pickup_label} → {activeTrip.dropoff_label}
          </Text>
          <Text style={styles.sub}>Status: {activeTrip.status}</Text>
          <Text style={styles.sub}>
            Fare ₱{Number(activeTrip.fare).toFixed(2)} · Earn ₱
            {Number(activeTrip.rider_earning).toFixed(2)}
          </Text>
          {activeTrip.service_type === "courier" ? (
            <Text style={styles.sub}>
              {activeTrip.parcel_description} · {activeTrip.recipient_name}
            </Text>
          ) : null}
          <View style={styles.row}>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => openMaps(activeTrip.dropoff_lat, activeTrip.dropoff_lng)}
            >
              <Text style={styles.btnSecondaryText}>Navigate</Text>
            </Pressable>
            {activeTrip.status === "accepted" ? (
              <Pressable style={styles.btn} onPress={() => advanceTrip("arrived_pickup")}>
                <Text style={styles.btnText}>Arrived pickup</Text>
              </Pressable>
            ) : null}
            {activeTrip.status === "arrived_pickup" ? (
              <Pressable style={styles.btn} onPress={() => advanceTrip("in_progress")}>
                <Text style={styles.btnText}>Start trip</Text>
              </Pressable>
            ) : null}
            {activeTrip.status === "in_progress" ? (
              <Pressable style={styles.btn} onPress={() => advanceTrip("completed")}>
                <Text style={styles.btnText}>Complete</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : activeDelivery ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active food delivery</Text>
          <Text style={styles.sub}>{activeDelivery.orders?.order_number}</Text>
          <Text style={styles.sub}>{activeDelivery.orders?.merchants?.name}</Text>
          <Text style={styles.sub}>Status: {activeDelivery.status}</Text>
          <Text style={styles.sub}>
            Earning ₱{Number(activeDelivery.rider_earning).toFixed(2)}
          </Text>
          <View style={styles.row}>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => openMaps(activeDelivery.dropoff_lat, activeDelivery.dropoff_lng)}
            >
              <Text style={styles.btnSecondaryText}>Navigate</Text>
            </Pressable>
            {activeDelivery.status === "assigned" ? (
              <Pressable style={styles.btn} onPress={() => advanceFood("arrived_store")}>
                <Text style={styles.btnText}>Arrived store</Text>
              </Pressable>
            ) : null}
            {activeDelivery.status === "arrived_store" ? (
              <Pressable style={styles.btn} onPress={() => advanceFood("picked_up")}>
                <Text style={styles.btnText}>Picked up</Text>
              </Pressable>
            ) : null}
            {activeDelivery.status === "picked_up" ? (
              <>
                <Pressable style={styles.btnSecondary} onPress={uploadProof}>
                  <Text style={styles.btnSecondaryText}>Upload POD</Text>
                </Pressable>
                <Pressable style={styles.btn} onPress={() => advanceFood("delivered")}>
                  <Text style={styles.btnText}>Delivered</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      ) : (
        <FlatList
          data={online ? filteredJobs : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
          ListEmptyComponent={
            <Text style={styles.sub}>
              {online
                ? "No available jobs right now."
                : "Go online to see ride, padala, and food jobs."}
            </Text>
          }
          renderItem={({ item }) =>
            item.kind === "trip" ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {tripServiceLabel(item.trip.service_type)} · {item.trip.trip_number}
                </Text>
                <Text style={styles.sub}>
                  {item.trip.pickup_label} → {item.trip.dropoff_label}
                </Text>
                <Text style={styles.sub}>
                  Fare ₱{Number(item.trip.fare).toFixed(2)} · Earn ₱
                  {Number(item.trip.rider_earning).toFixed(2)}
                </Text>
                <Pressable style={styles.btn} onPress={() => acceptTrip(item.trip.id)}>
                  <Text style={styles.btnText}>Accept trip</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Food · {item.delivery.orders?.order_number}
                </Text>
                <Text style={styles.sub}>{item.delivery.orders?.merchants?.name}</Text>
                <Text style={styles.sub}>
                  {item.delivery.orders?.merchants?.address_line}
                </Text>
                <Text style={styles.sub}>
                  Fee ₱{Number(item.delivery.orders?.delivery_fee ?? 0).toFixed(2)} · Earn ₱
                  {Number(item.delivery.rider_earning).toFixed(2)}
                </Text>
                <Pressable style={styles.btn} onPress={() => acceptFood(item.delivery.id)}>
                  <Text style={styles.btnText}>Accept job</Text>
                </Pressable>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 28, fontWeight: "800", color: theme.colors.brandDeep },
  badge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#e4efe7",
    color: theme.colors.brandDeep,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "700",
    fontSize: 12,
  },
  link: { color: theme.colors.brand, fontWeight: "800" },
  toggle: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: theme.colors.bgElevated,
  },
  toggleOn: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  sub: { color: theme.colors.muted, marginTop: 4 },
  card: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    marginTop: 12,
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.bgElevated,
  },
  chipActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  btn: {
    backgroundColor: theme.colors.brand,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btnText: { color: "#fff", fontWeight: "800" },
  btnSecondary: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  btnSecondaryText: { fontWeight: "800", color: theme.colors.brandDeep },
});
