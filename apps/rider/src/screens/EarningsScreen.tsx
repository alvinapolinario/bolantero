import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { tripServiceLabel } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Delivery = Tables<"deliveries">;
type Trip = Tables<"trips">;

type LedgerItem =
  | { kind: "food"; id: string; at: string; amount: number }
  | { kind: "trip"; id: string; at: string; amount: number; service: Trip["service_type"] };

export function EarningsScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<LedgerItem[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: deliveries }, { data: trips }] = await Promise.all([
        supabase
          .from("deliveries")
          .select("*")
          .eq("rider_id", user.id)
          .eq("status", "delivered")
          .order("delivered_at", { ascending: false }),
        supabase
          .from("trips")
          .select("*")
          .eq("rider_id", user.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false }),
      ]);

      const food: LedgerItem[] = (deliveries ?? []).map((row: Delivery) => ({
        kind: "food",
        id: row.id,
        at: row.delivered_at ?? row.updated_at,
        amount: Number(row.rider_earning),
      }));
      const tripRows: LedgerItem[] = (trips ?? []).map((row: Trip) => ({
        kind: "trip",
        id: row.id,
        at: row.completed_at ?? row.updated_at,
        amount: Number(row.rider_earning),
        service: row.service_type,
      }));
      setItems(
        [...food, ...tripRows].sort((a, b) => (a.at < b.at ? 1 : -1)),
      );
    })();
  }, []);

  const total = useMemo(
    () => items.reduce((sum, row) => sum + row.amount, 0),
    [items],
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Earnings ledger</Text>
      <View style={styles.card}>
        <Text style={styles.sub}>Completed food jobs + trips</Text>
        <Text style={styles.total}>₱{total.toFixed(2)}</Text>
        <Text style={styles.sub}>MVP ledger only — payouts configured later.</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.rowCard}>
            <Text style={{ fontWeight: "800" }}>₱{item.amount.toFixed(2)}</Text>
            <Text style={styles.sub}>
              {item.kind === "trip" ? tripServiceLabel(item.service) : "Food"} ·{" "}
              {item.at ? new Date(item.at).toLocaleString() : "Completed"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 16 },
  link: { color: theme.colors.brand, fontWeight: "800", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: theme.colors.brandDeep },
  card: {
    marginTop: 12,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  total: {
    fontSize: 36,
    fontWeight: "800",
    color: theme.colors.brandDeep,
    marginVertical: 6,
  },
  sub: { color: theme.colors.muted },
  rowCard: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
});
