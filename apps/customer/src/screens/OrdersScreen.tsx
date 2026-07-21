import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Order = Tables<"orders">;
type Delivery = Tables<"deliveries">;

export function OrdersScreen({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery>>({});
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [score, setScore] = useState("5");
  const [comment, setComment] = useState("");

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data ?? []);

    if (data?.length) {
      const { data: dels } = await supabase
        .from("deliveries")
        .select("*")
        .in(
          "order_id",
          data.map((o) => o.id),
        );
      const map: Record<string, Delivery> = {};
      (dels ?? []).forEach((d) => {
        map[d.order_id] = d;
      });
      setDeliveries(map);
    }
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("customer-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function submitRating(order: Order) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const delivery = deliveries[order.id];
    if (!delivery?.rider_id) return;
    await supabase.from("ratings").insert({
      order_id: order.id,
      rater_id: user.id,
      ratee_id: delivery.rider_id,
      target: "rider",
      score: Number(score),
      comment,
    });
    setRatingOrderId(null);
    setComment("");
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Orders & tracking</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
        ListEmptyComponent={<Text style={styles.sub}>No orders yet.</Text>}
        renderItem={({ item }) => {
          const delivery = deliveries[item.id];
          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.order_number}</Text>
              <Text style={styles.sub}>Order: {item.status}</Text>
              <Text style={styles.sub}>
                Delivery: {delivery?.status ?? "awaiting_rider"}
              </Text>
              <Text style={styles.sub}>
                Food ₱{Number(item.subtotal).toFixed(2)} · Fee ₱
                {Number(item.delivery_fee).toFixed(2)}
              </Text>
              {delivery?.status === "delivered" ? (
                ratingOrderId === item.id ? (
                  <View style={{ marginTop: 8, gap: 8 }}>
                    <TextInput
                      style={styles.input}
                      value={score}
                      onChangeText={setScore}
                      keyboardType="number-pad"
                      placeholder="Score 1-5"
                    />
                    <TextInput
                      style={styles.input}
                      value={comment}
                      onChangeText={setComment}
                      placeholder="Comment"
                    />
                    <Pressable style={styles.btn} onPress={() => submitRating(item)}>
                      <Text style={styles.btnText}>Submit rating</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.btn} onPress={() => setRatingOrderId(item.id)}>
                    <Text style={styles.btnText}>Rate rider</Text>
                  </Pressable>
                )
              ) : null}
            </View>
          );
        }}
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
  input: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  btn: {
    marginTop: 10,
    backgroundColor: theme.colors.brand,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
