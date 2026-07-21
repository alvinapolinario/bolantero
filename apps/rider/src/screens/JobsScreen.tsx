import { useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { verifiedBadgeLabel } from "@bolantero/shared";
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

export function JobsScreen({ onOpenEarnings }: { onOpenEarnings: () => void }) {
  const [online, setOnline] = useState(false);
  const [jobs, setJobs] = useState<Delivery[]>([]);
  const [active, setActive] = useState<Delivery | null>(null);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

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

    const { data: available } = await supabase
      .from("deliveries")
      .select("*, orders(order_number, status, delivery_fee, merchant_id)")
      .eq("status", "awaiting_rider")
      .order("created_at", { ascending: true });

    const enriched: Delivery[] = [];
    for (const row of available ?? []) {
      const merchantId = row.orders?.merchant_id as string | undefined;
      let merchants = null;
      if (merchantId) {
        const { data: merchant } = await supabase
          .from("merchants")
          .select("name, address_line")
          .eq("id", merchantId)
          .maybeSingle();
        merchants = merchant;
      }
      enriched.push({
        ...row,
        orders: row.orders
          ? { ...row.orders, merchants }
          : null,
      } as Delivery);
    }
    setJobs(enriched);

    const { data: mine } = await supabase
      .from("deliveries")
      .select("*, orders(order_number, status, delivery_fee, merchant_id)")
      .eq("rider_id", user.id)
      .in("status", ["assigned", "arrived_store", "picked_up"])
      .maybeSingle();

    if (mine) {
      const merchantId = mine.orders?.merchant_id as string | undefined;
      let merchants = null;
      if (merchantId) {
        const { data: merchant } = await supabase
          .from("merchants")
          .select("name, address_line")
          .eq("id", merchantId)
          .maybeSingle();
        merchants = merchant;
      }
      setActive({
        ...mine,
        orders: mine.orders ? { ...mine.orders, merchants } : null,
      } as Delivery);
    } else {
      setActive(null);
    }
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

  async function accept(jobId: string) {
    const { error } = await supabase.rpc("accept_delivery", {
      p_delivery_id: jobId,
    });
    setMessage(error ? error.message : "Job accepted.");
    await refresh();
  }

  async function advance(status: Delivery["status"]) {
    if (!active) return;
    const patch: Record<string, unknown> = { status };
    if (status === "picked_up") patch.picked_up_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    await supabase.from("deliveries").update(patch).eq("id", active.id);
    if (status === "delivered") {
      await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", active.order_id);
    }
    await refresh();
  }

  async function uploadProof() {
    if (!active) return;
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
      .eq("id", active.id);
    setMessage("Proof of delivery uploaded.");
    await refresh();
  }

  function openMaps() {
    if (!active?.dropoff_lat || !active.dropoff_lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${active.dropoff_lat},${active.dropoff_lng}`;
    Linking.openURL(url);
  }

  const badge = verifiedBadgeLabel(level);

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

      {message ? <Text style={styles.sub}>{message}</Text> : null}

      {active ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active delivery</Text>
          <Text style={styles.sub}>{active.orders?.order_number}</Text>
          <Text style={styles.sub}>{active.orders?.merchants?.name}</Text>
          <Text style={styles.sub}>Status: {active.status}</Text>
          <Text style={styles.sub}>
            Earning ₱{Number(active.rider_earning).toFixed(2)}
          </Text>
          <View style={styles.row}>
            <Pressable style={styles.btnSecondary} onPress={openMaps}>
              <Text style={styles.btnSecondaryText}>Navigate</Text>
            </Pressable>
            {active.status === "assigned" ? (
              <Pressable style={styles.btn} onPress={() => advance("arrived_store")}>
                <Text style={styles.btnText}>Arrived store</Text>
              </Pressable>
            ) : null}
            {active.status === "arrived_store" ? (
              <Pressable style={styles.btn} onPress={() => advance("picked_up")}>
                <Text style={styles.btnText}>Picked up</Text>
              </Pressable>
            ) : null}
            {active.status === "picked_up" ? (
              <>
                <Pressable style={styles.btnSecondary} onPress={uploadProof}>
                  <Text style={styles.btnSecondaryText}>Upload POD</Text>
                </Pressable>
                <Pressable style={styles.btn} onPress={() => advance("delivered")}>
                  <Text style={styles.btnText}>Delivered</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      ) : (
        <FlatList
          data={online ? jobs : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
          ListEmptyComponent={
            <Text style={styles.sub}>
              {online
                ? "No available jobs right now."
                : "Go online to see delivery requests."}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.orders?.order_number}</Text>
              <Text style={styles.sub}>{item.orders?.merchants?.name}</Text>
              <Text style={styles.sub}>{item.orders?.merchants?.address_line}</Text>
              <Text style={styles.sub}>
                Fee ₱{Number(item.orders?.delivery_fee ?? 0).toFixed(2)} · Earn ₱
                {Number(item.rider_earning).toFixed(2)}
              </Text>
              <Pressable style={styles.btn} onPress={() => accept(item.id)}>
                <Text style={styles.btnText}>Accept job</Text>
              </Pressable>
            </View>
          )}
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
