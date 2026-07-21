import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import {
  DEFAULT_FEE_RULE,
  calculateDeliveryFee,
  estimateDistanceKm,
  type DeliveryType,
} from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { cartSubtotal, type CartItem } from "../state/cart";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Address = Tables<"addresses">;
type Merchant = Tables<"merchants">;

export function CartScreen({
  items,
  onBack,
  onPlaced,
}: {
  items: CartItem[];
  onBack: () => void;
  onPlaced: (orderId: string) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("immediate");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id);
      if (existing?.length) {
        setAddresses(existing);
        setAddressId(existing[0].id);
      } else {
        const { data: created } = await supabase
          .from("addresses")
          .insert({
            user_id: user.id,
            label: "Home",
            line1: "Poblacion",
            barangay: "Poblacion",
            city: "Tacurong City",
            service_area_code: "tacurong",
            lat: 6.6925,
            lng: 124.8472,
            is_default: true,
          })
          .select("*")
          .single();
        if (created) {
          setAddresses([created]);
          setAddressId(created.id);
        }
      }

      if (items[0]) {
        const { data } = await supabase
          .from("merchants")
          .select("*")
          .eq("id", items[0].merchantId)
          .maybeSingle();
        setMerchant(data);
      }
    })();
  }, [items]);

  const subtotal = cartSubtotal(items);
  const address = addresses.find((a) => a.id === addressId) ?? null;
  const distanceKm =
    merchant && address
      ? estimateDistanceKm(merchant.lat, merchant.lng, address.lat, address.lng)
      : 3;
  const fees = useMemo(
    () =>
      calculateDeliveryFee({
        distanceKm,
        deliveryType,
        paymentMethod,
        rule: DEFAULT_FEE_RULE,
      }),
    [distanceKm, deliveryType, paymentMethod],
  );

  async function placeOrder() {
    if (!items.length || !addressId) return;
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase.rpc("place_order", {
      p_merchant_id: items[0].merchantId,
      p_address_id: addressId,
      p_delivery_type: deliveryType,
      p_payment_method: paymentMethod,
      p_items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      p_notes: null,
      p_scheduled_for: null,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    onPlaced(data.id);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Checkout</Text>

      {items.length === 0 ? (
        <Text style={styles.sub}>Cart is empty.</Text>
      ) : (
        <>
          {items.map((item) => (
            <View key={item.productId} style={styles.card}>
              <Text style={styles.cardTitle}>
                {item.quantity}× {item.name}
              </Text>
              <Text style={styles.sub}>
                ₱{(item.unitPrice * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <Text style={styles.section}>Delivery type</Text>
          <View style={styles.row}>
            {(["immediate", "scheduled", "express"] as DeliveryType[]).map((type) => (
              <Pressable
                key={type}
                style={[styles.chip, deliveryType === type && styles.chipActive]}
                onPress={() => setDeliveryType(type)}
              >
                <Text style={{ color: deliveryType === type ? "#fff" : theme.colors.ink, fontWeight: "700" }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>Payment</Text>
          <View style={styles.row}>
            {(["cod", "online"] as const).map((method) => (
              <Pressable
                key={method}
                style={[styles.chip, paymentMethod === method && styles.chipActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={{ color: paymentMethod === method ? "#fff" : theme.colors.ink, fontWeight: "700" }}>
                  {method.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transparent fee breakdown</Text>
            <Text style={styles.sub}>Food subtotal (100% to merchant): ₱{subtotal.toFixed(2)}</Text>
            <Text style={styles.sub}>Distance: {distanceKm} km</Text>
            <Text style={styles.sub}>Delivery fee: ₱{fees.deliveryFee.toFixed(2)}</Text>
            <Text style={styles.total}>
              Total due: ₱{(subtotal + fees.deliveryFee).toFixed(2)}
            </Text>
          </View>

          <Pressable style={styles.btn} onPress={placeOrder} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Placing..." : "Place order"}</Text>
          </Pressable>
          {message ? <Text style={styles.error}>{message}</Text> : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 16 },
  link: { color: theme.colors.brand, fontWeight: "800", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: theme.colors.brandDeep },
  sub: { color: theme.colors.muted, marginTop: 4 },
  section: { marginTop: 16, marginBottom: 8, fontWeight: "800" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.bgElevated,
  },
  chipActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  card: {
    marginTop: 12,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  cardTitle: { fontWeight: "800" },
  total: { marginTop: 8, fontWeight: "800", fontSize: 18, color: theme.colors.brandDeep },
  btn: {
    marginTop: 16,
    backgroundColor: theme.colors.brand,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
  error: { color: theme.colors.danger, marginTop: 10 },
});
