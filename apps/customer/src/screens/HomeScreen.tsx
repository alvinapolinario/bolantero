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
  onOpenVerify,
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
        <View>
          <Pressable onPress={onBack}>
            <Text style={styles.link}>← Services</Text>
          </Pressable>
          <Text style={styles.brand}>Food</Text>
          <Text style={styles.sub}>Phase 1 merchants · SK launch cities</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onOpenVerify}>
            <Text style={styles.link}>Verify</Text>
          </Pressable>
          <Pressable onPress={onOpenOrders}>
            <Text style={styles.link}>Orders</Text>
          </Pressable>
          <Pressable onPress={onOpenCart}>
            <Text style={styles.link}>Cart</Text>
          </Pressable>
        </View>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search merchants"
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        horizontal
        data={[{ slug: null, name: "All" }, ...FOOD_CATEGORIES]}
        keyExtractor={(item) => item.slug ?? "all"}
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48, marginBottom: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.chip,
              (item.slug ?? null) === category ? styles.chipActive : null,
            ]}
            onPress={() => setCategory(item.slug)}
          >
            <Text
              style={{
                color:
                  (item.slug ?? null) === category
                    ? theme.colors.white
                    : theme.colors.ink,
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
        ListEmptyComponent={
          <Text style={styles.sub}>No approved food merchants yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onOpenMerchant(item)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.sub}>
              {item.category_slug} · {item.service_area_code}
            </Text>
            <Text style={styles.sub}>{item.address_line}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  brand: { fontSize: 28, fontWeight: "800", color: theme.colors.brandDeep },
  sub: { color: theme.colors.muted, marginTop: 2 },
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
  actions: { gap: 8, alignItems: "flex-end" },
  link: { color: theme.colors.brand, fontWeight: "800" },
  search: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    marginRight: 8,
    backgroundColor: theme.colors.bgElevated,
  },
  chipActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  card: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.ink },
});
