import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { tripServiceLabel } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Trip = Tables<"trips">;
type Order = Tables<"orders">;

type ActivityItem =
  | { kind: "trip"; at: string; trip: Trip }
  | { kind: "order"; at: string; order: Order };

export function ActivityScreen({
  onBack,
  onOpenTrip,
  onOpenFoodOrders,
}: {
  onBack: () => void;
  onOpenTrip: (tripId: string) => void;
  onOpenFoodOrders: () => void;
}) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: tripRows }, { data: orderRows }] = await Promise.all([
      supabase
        .from("trips")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setTrips(tripRows ?? []);
    setOrders(orderRows ?? []);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("customer-activity")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const items = useMemo<ActivityItem[]>(() => {
    return [
      ...trips.map((trip) => ({ kind: "trip" as const, at: trip.created_at, trip })),
      ...orders.map((order) => ({ kind: "order" as const, at: order.created_at, order })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [trips, orders]);

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Services</Text>
      </Pressable>
      <Text style={styles.title}>Activity</Text>
      <Pressable onPress={onOpenFoodOrders}>
        <Text style={styles.link}>Food orders & ratings</Text>
      </Pressable>
      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.kind === "trip" ? item.trip.id : item.order.id
        }
        contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
        ListEmptyComponent={<Text style={styles.sub}>No trips or orders yet.</Text>}
        renderItem={({ item }) =>
          item.kind === "trip" ? (
            <Pressable style={styles.card} onPress={() => onOpenTrip(item.trip.id)}>
              <Text style={styles.cardTitle}>{item.trip.trip_number}</Text>
              <Text style={styles.sub}>
                {tripServiceLabel(item.trip.service_type)} · {item.trip.status}
              </Text>
              <Text style={styles.sub}>
                {item.trip.pickup_label} → {item.trip.dropoff_label} · ₱
                {Number(item.trip.fare).toFixed(2)}
              </Text>
            </Pressable>
          ) : (
            <Pressable style={styles.card} onPress={onOpenFoodOrders}>
              <Text style={styles.cardTitle}>{item.order.order_number}</Text>
              <Text style={styles.sub}>Food · {item.order.status}</Text>
              <Text style={styles.sub}>
                Food ₱{Number(item.order.subtotal).toFixed(2)} · Fee ₱
                {Number(item.order.delivery_fee).toFixed(2)}
              </Text>
            </Pressable>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 16 },
  link: { color: theme.colors.brand, fontWeight: "800", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: theme.colors.brandDeep },
  sub: { color: theme.colors.muted, marginTop: 4 },
  card: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },
});
