import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";
import type { CartItem } from "../state/cart";

type Merchant = Tables<"merchants">;
type Product = Tables<"products">;

export function MerchantScreen({
  merchant,
  onAdd,
  onBack,
}: {
  merchant: Merchant;
  onAdd: (item: CartItem) => void;
  onBack: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("merchant_id", merchant.id)
      .eq("is_available", true)
      .then(({ data }) => setProducts(data ?? []));
  }, [merchant.id]);

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>{merchant.name}</Text>
      <Text style={styles.sub}>
        {merchant.category_slug} · {merchant.service_area_code}
      </Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
        ListEmptyComponent={<Text style={styles.sub}>No available items.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.sub}>{item.description}</Text>
              <Text style={styles.price}>₱{Number(item.price).toFixed(2)}</Text>
            </View>
            <Pressable
              style={styles.btn}
              onPress={() =>
                onAdd({
                  productId: item.id,
                  name: item.name,
                  unitPrice: Number(item.price),
                  quantity: 1,
                  merchantId: merchant.id,
                })
              }
            >
              <Text style={styles.btnText}>Add</Text>
            </Pressable>
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
  sub: { color: theme.colors.muted },
  card: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },
  price: { marginTop: 6, fontWeight: "800", color: theme.colors.brand },
  btn: {
    backgroundColor: theme.colors.brand,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
