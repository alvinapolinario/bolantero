import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  LANDMARKS,
  PARCEL_SIZES,
  SERVICE_AREAS,
  calculateTripFare,
  defaultRuleForService,
  estimateTripDistanceKm,
  tripRequestSchema,
  tripServiceLabel,
  type ParcelSize,
  type ServiceAreaCode,
  type TripServiceType,
} from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Address = Tables<"addresses">;
type Stop = {
  label: string;
  line1: string;
  barangay: string;
  city: string;
  lat: number;
  lng: number;
};

type Quote = {
  distanceKm: number;
  fare: number;
  platformFee: number;
  riderEarning: number;
  sizeSurcharge: number;
};

export function BookTripScreen({
  serviceType,
  onBack,
  onBooked,
}: {
  serviceType: TripServiceType;
  onBack: () => void;
  onBooked: (tripId: string) => void;
}) {
  const [area, setArea] = useState<ServiceAreaCode>("tacurong");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [pickup, setPickup] = useState<Stop | null>(null);
  const [dropoff, setDropoff] = useState<Stop | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [parcelSize, setParcelSize] = useState<ParcelSize>("small");
  const [parcelDescription, setParcelDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("+639171111111");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const landmarks = useMemo(
    () => LANDMARKS.filter((l) => l.serviceAreaCode === area),
    [area],
  );

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id);
      setAddresses(data ?? []);
    })();
  }, []);

  useEffect(() => {
    setPickup(null);
    setDropoff(null);
    setQuote(null);
  }, [area, serviceType]);

  const localQuote = useMemo(() => {
    if (!pickup || !dropoff) return null;
    const distanceKm = estimateTripDistanceKm(
      pickup.lat,
      pickup.lng,
      dropoff.lat,
      dropoff.lng,
    );
    return calculateTripFare({
      distanceKm,
      serviceType,
      parcelSize: serviceType === "courier" ? parcelSize : null,
      rule: defaultRuleForService(serviceType),
    });
  }, [pickup, dropoff, serviceType, parcelSize]);

  async function loadQuote() {
    if (!pickup || !dropoff) {
      setMessage("Choose pickup and dropoff.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase.rpc("quote_trip", {
      p_service_type: serviceType,
      p_service_area_code: area,
      p_pickup_lat: pickup.lat,
      p_pickup_lng: pickup.lng,
      p_dropoff_lat: dropoff.lat,
      p_dropoff_lng: dropoff.lng,
      p_parcel_size: serviceType === "courier" ? parcelSize : null,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    const row = data as Quote;
    setQuote(row);
  }

  async function confirm() {
    if (!pickup || !dropoff) return;
    const parsed = tripRequestSchema.safeParse({
      serviceType,
      serviceAreaCode: area,
      pickup,
      dropoff,
      paymentMethod,
      parcelSize: serviceType === "courier" ? parcelSize : null,
      parcelDescription: serviceType === "courier" ? parcelDescription : null,
      recipientName: serviceType === "courier" ? recipientName : null,
      recipientPhone: serviceType === "courier" ? recipientPhone : null,
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check padala details.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase.rpc("request_trip", {
      p_service_type: serviceType,
      p_service_area_code: area,
      p_pickup_label: pickup.label,
      p_pickup_line1: pickup.line1,
      p_pickup_barangay: pickup.barangay,
      p_pickup_city: pickup.city,
      p_pickup_lat: pickup.lat,
      p_pickup_lng: pickup.lng,
      p_dropoff_label: dropoff.label,
      p_dropoff_line1: dropoff.line1,
      p_dropoff_barangay: dropoff.barangay,
      p_dropoff_city: dropoff.city,
      p_dropoff_lat: dropoff.lat,
      p_dropoff_lng: dropoff.lng,
      p_payment_method: paymentMethod,
      p_parcel_size: serviceType === "courier" ? parcelSize : null,
      p_parcel_description: serviceType === "courier" ? parcelDescription : null,
      p_recipient_name: serviceType === "courier" ? recipientName : null,
      p_recipient_phone: serviceType === "courier" ? recipientPhone : null,
      p_notes: null,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    onBooked(data.id);
  }

  function stopChip(
    stop: Stop,
    selected: Stop | null,
    onSelect: (stop: Stop) => void,
  ) {
    const active =
      selected?.lat === stop.lat &&
      selected?.lng === stop.lng &&
      selected?.label === stop.label;
    return (
      <Pressable
        key={`${stop.label}-${stop.lat}`}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => {
          onSelect(stop);
          setQuote(null);
        }}
      >
        <Text style={{ color: active ? "#fff" : theme.colors.ink, fontWeight: "700" }}>
          {stop.label}
        </Text>
      </Pressable>
    );
  }

  const savedStops: Stop[] = addresses
    .filter((a) => a.service_area_code === area)
    .map((a) => ({
      label: a.label,
      line1: a.line1,
      barangay: a.barangay,
      city: a.city,
      lat: a.lat,
      lng: a.lng,
    }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Services</Text>
      </Pressable>
      <Text style={styles.title}>Book {tripServiceLabel(serviceType)}</Text>
      <Text style={styles.sub}>Motorcycle only · landmark pickup in launch cities</Text>

      <Text style={styles.section}>Service area</Text>
      <View style={styles.row}>
        {SERVICE_AREAS.map((item) => (
          <Pressable
            key={item.code}
            style={[styles.chip, area === item.code && styles.chipActive]}
            onPress={() => setArea(item.code)}
          >
            <Text style={{ color: area === item.code ? "#fff" : theme.colors.ink, fontWeight: "700" }}>
              {item.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Pickup</Text>
      <View style={styles.row}>
        {savedStops.map((stop) => stopChip(stop, pickup, setPickup))}
        {landmarks.map((stop) => stopChip(stop, pickup, setPickup))}
      </View>

      <Text style={styles.section}>Dropoff</Text>
      <View style={styles.row}>
        {savedStops.map((stop) => stopChip(stop, dropoff, setDropoff))}
        {landmarks.map((stop) => stopChip(stop, dropoff, setDropoff))}
      </View>

      {serviceType === "courier" ? (
        <>
          <Text style={styles.section}>Padala details</Text>
          <View style={styles.row}>
            {PARCEL_SIZES.map((size) => (
              <Pressable
                key={size}
                style={[styles.chip, parcelSize === size && styles.chipActive]}
                onPress={() => {
                  setParcelSize(size);
                  setQuote(null);
                }}
              >
                <Text style={{ color: parcelSize === size ? "#fff" : theme.colors.ink, fontWeight: "700" }}>
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Item description"
            value={parcelDescription}
            onChangeText={setParcelDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Recipient name"
            value={recipientName}
            onChangeText={setRecipientName}
          />
          <TextInput
            style={styles.input}
            placeholder="Recipient phone +639..."
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            keyboardType="phone-pad"
          />
        </>
      ) : null}

      <Text style={styles.section}>Payment</Text>
      <View style={styles.row}>
        {(["cod", "online"] as const).map((method) => (
          <Pressable
            key={method}
            style={[styles.chip, paymentMethod === method && styles.chipActive]}
            onPress={() => setPaymentMethod(method)}
          >
            <Text style={{ color: paymentMethod === method ? "#fff" : theme.colors.ink, fontWeight: "700" }}>
              {method === "cod" ? "Cash" : "Online intent"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fare quote</Text>
        <Text style={styles.sub}>
          Estimate ₱{(localQuote?.fare ?? 0).toFixed(2)} · server quote required
        </Text>
        {quote ? (
          <>
            <Text style={styles.sub}>Distance {Number(quote.distanceKm).toFixed(1)} km</Text>
            <Text style={styles.total}>Fare ₱{Number(quote.fare).toFixed(2)}</Text>
            <Text style={styles.sub}>
              Platform ₱{Number(quote.platformFee).toFixed(2)} · Rider ₱
              {Number(quote.riderEarning).toFixed(2)}
            </Text>
          </>
        ) : null}
      </View>

      <Pressable style={styles.btnSecondary} onPress={loadQuote} disabled={loading}>
        <Text style={styles.btnSecondaryText}>{loading ? "Quoting..." : "Get fare quote"}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={confirm} disabled={loading || !quote}>
        <Text style={styles.btnText}>Confirm booking</Text>
      </Pressable>
      {message ? <Text style={styles.error}>{message}</Text> : null}
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
  input: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  card: {
    marginTop: 16,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  cardTitle: { fontWeight: "800" },
  total: { marginTop: 8, fontWeight: "800", fontSize: 18, color: theme.colors.brandDeep },
  btn: {
    marginTop: 12,
    backgroundColor: theme.colors.brand,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
  btnSecondary: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  btnSecondaryText: { fontWeight: "800", color: theme.colors.brandDeep },
  error: { color: theme.colors.danger, marginTop: 10 },
});
