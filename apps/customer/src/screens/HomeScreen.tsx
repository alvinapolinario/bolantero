import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FOOD_CATEGORIES, verifiedBadgeLabel } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Merchant = Tables<"merchants">;
type Profile = Tables<"profiles">;

export function HomeScreen({
  onBack,
  onOpenMerchant,
  onOpenCart,
  onOpenOrders,
}: {
  onBack: () => void;
  onOpenMerchant: (merchant: Merchant) => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenVerify: () => void;
}) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setProfile(data);
      }

      let req = supabase
        .from("merchants")
        .select("*")
        .eq("status", "approved")
        .order("name");
      if (category) req = req.eq("category_slug", category);
      const { data } = await req;
      setMerchants(data ?? []);
    })();
  }, [category]);

  const badge = profile ? verifiedBadgeLabel(profile.verification_level) : null;
  const filtered = merchants.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Food</Text>
          <Text style={styles.sub}>Nearby merchants · SK cities</Text>
        </View>
        <Pressable onPress={onOpenOrders}>
          <Text style={styles.orders}>Orders</Text>
        </Pressable>
        <Pressable onPress={onOpenCart} style={styles.cartBtn}>
          <Text style={styles.cartText}>Cart</Text>
        </Pressable>
      </View>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}

      <TextInput
        style={styles.search}
        placeholder="Search food"
        value={query}
        onChangeText={setQuery}
        placeholderTextColor={theme.colors.muted}
      />

      <FlatList
        horizontal
        data={[{ slug: null, name: "All" }, ...FOOD_CATEGORIES]}
        keyExtractor={(item) => item.slug ?? "all"}
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48, marginBottom: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, (item.slug ?? null) === category ? styles.chipActive : null]}
            onPress={() => setCategory(item.slug)}
          >
            <Text
              style={{
                color: (item.slug ?? null) === category ? theme.colors.white : theme.colors.ink,
                fontWeight: "700",
              }}
            >
              {item.name}
            </Text>
          </Pressable>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.sub}>No approved food merchants yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onOpenMerchant(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.sub}>
                {item.category_slug} · {item.service_area_code}
              </Text>
              <Text style={styles.sub}>{item.address_line}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5f3", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontWeight: "800", fontSize: 18, color: theme.colors.brandDeep },
  brand: { fontSize: 24, fontWeight: "800", color: theme.colors.brandDeep },
  sub: { color: theme.colors.muted, marginTop: 2, fontSize: 13 },
  badge: {
    marginBottom: 10,
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
  cartBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: "center",
  },
  cartText: { color: theme.colors.white, fontWeight: "800" },
  orders: { color: theme.colors.brand, fontWeight: "800" },
  search: {
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: theme.colors.white,
  },
  chipActive: { backgroundColor: theme.colors.brand },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#e4efe7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "800", color: theme.colors.brandDeep, fontSize: 18 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.ink },
});
