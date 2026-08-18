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
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
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
      <Text style={styles.title}>Activity</Text>
      <Text style={styles.lead}>Trips and food orders in one list.</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => (item.kind === "trip" ? item.trip.id : item.order.id)}
        contentContainerStyle={{ gap: 10, paddingVertical: 16, paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.sub}>No trips or orders yet. Book a Ride from Home.</Text>}
        renderItem={({ item }) =>
          item.kind === "trip" ? (
            <Pressable style={styles.card} onPress={() => onOpenTrip(item.trip.id)}>
              <View style={styles.cardTop}>
                <Text style={styles.kind}>{tripServiceLabel(item.trip.service_type)}</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{item.trip.status.replace("_", " ")}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.trip.trip_number}</Text>
              <Text style={styles.route}>
                {item.trip.pickup_label} → {item.trip.dropoff_label}
              </Text>
              <Text style={styles.fare}>₱{Number(item.trip.fare).toFixed(2)}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.card} onPress={onOpenFoodOrders}>
              <View style={styles.cardTop}>
                <Text style={styles.kind}>Food</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{item.order.status}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.order.order_number}</Text>
              <Text style={styles.route}>
                Food ₱{Number(item.order.subtotal).toFixed(2)} · Delivery ₱
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
  container: { flex: 1, backgroundColor: "#f4f5f3", paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: "800", color: theme.colors.brandDeep },
  lead: { color: theme.colors.muted, marginTop: 4 },
  sub: { color: theme.colors.muted, marginTop: 24 },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kind: { fontWeight: "800", color: theme.colors.brand, fontSize: 12, textTransform: "uppercase" },
  pill: {
    backgroundColor: "#eef3ee",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontSize: 11, fontWeight: "700", color: theme.colors.brandDeep, textTransform: "capitalize" },
  cardTitle: { fontWeight: "800", fontSize: 16, marginTop: 8, color: theme.colors.ink },
  route: { color: theme.colors.muted, marginTop: 4 },
  fare: { marginTop: 8, fontWeight: "800", color: theme.colors.brandDeep },
});
