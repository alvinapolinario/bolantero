import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Delivery = Tables<"deliveries">;

export function EarningsScreen({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<Delivery[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("deliveries")
        .select("*")
        .eq("rider_id", user.id)
        .eq("status", "delivered")
        .order("delivered_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, []);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.rider_earning), 0),
    [rows],
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Earnings ledger</Text>
      <View style={styles.card}>
        <Text style={styles.sub}>Completed deliveries</Text>
        <Text style={styles.total}>₱{total.toFixed(2)}</Text>
        <Text style={styles.sub}>MVP ledger only — payouts configured later.</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.rowCard}>
            <Text style={{ fontWeight: "800" }}>
              ₱{Number(item.rider_earning).toFixed(2)}
            </Text>
            <Text style={styles.sub}>
              {item.delivered_at
                ? new Date(item.delivered_at).toLocaleString()
                : "Delivered"}
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
