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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";
import { MapCanvas } from "../ui/MapCanvas";

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
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState<ServiceAreaCode>("tacurong");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [pickup, setPickup] = useState<Stop | null>(null);
  const [dropoff, setDropoff] = useState<Stop | null>(null);
  const [picking, setPicking] = useState<"pickup" | "dropoff">("pickup");
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
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id);
      setAddresses(data ?? []);
    })();
  }, []);

  useEffect(() => {
    setPickup(null);
    setDropoff(null);
    setQuote(null);
    setPicking("pickup");
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
    setQuote(data as Quote);
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

  function chooseStop(stop: Stop) {
    if (picking === "pickup") {
      setPickup(stop);
      setPicking("dropoff");
    } else {
      setDropoff(stop);
    }
    setQuote(null);
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
  const stops = [...savedStops, ...landmarks];
  const fare = quote ?? localQuote;

  return (
    <View style={styles.root}>
      <MapCanvas area={area} pickup={pickup} dropoff={dropoff} />
      <Pressable
        style={[styles.back, { top: Math.max(insets.top, 8) }]}
        onPress={onBack}
        accessibilityRole="button"
      >
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{tripServiceLabel(serviceType)}</Text>
          <Text style={styles.sub}>Motorcycle · pick a landmark in a launch city</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {SERVICE_AREAS.map((item) => (
              <Pressable
                key={item.code}
                style={[styles.chip, area === item.code && styles.chipOn]}
                onPress={() => setArea(item.code)}
              >
                <Text style={[styles.chipText, area === item.code && styles.chipTextOn]}>{item.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.stopRow} onPress={() => setPicking("pickup")}>
            <View style={styles.dotA} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stopLabel}>Pickup</Text>
              <Text style={styles.stopValue}>{pickup ? `${pickup.label} · ${pickup.city}` : "Choose pickup"}</Text>
            </View>
          </Pressable>
          <View style={styles.connector} />
          <Pressable style={styles.stopRow} onPress={() => setPicking("dropoff")}>
            <View style={styles.dotB} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stopLabel}>Dropoff</Text>
              <Text style={styles.stopValue}>{dropoff ? `${dropoff.label} · ${dropoff.city}` : "Where to?"}</Text>
            </View>
          </Pressable>

          <Text style={styles.section}>
            {picking === "pickup" ? "Set pickup" : "Set dropoff"}
          </Text>
          {stops.map((stop) => {
            const selected =
              (picking === "pickup" ? pickup : dropoff)?.label === stop.label &&
              (picking === "pickup" ? pickup : dropoff)?.lat === stop.lat;
            return (
              <Pressable
                key={`${stop.label}-${stop.lat}`}
                style={[styles.place, selected && styles.placeOn]}
                onPress={() => chooseStop(stop)}
              >
                <Text style={styles.placeName}>{stop.label}</Text>
                <Text style={styles.placeMeta}>
                  {stop.line1} · {stop.city}
                </Text>
              </Pressable>
            );
          })}

          {serviceType === "courier" ? (
            <>
              <Text style={styles.section}>Package</Text>
              <View style={styles.rowWrap}>
                {PARCEL_SIZES.map((size) => (
                  <Pressable
                    key={size}
                    style={[styles.chip, parcelSize === size && styles.chipOn]}
                    onPress={() => {
                      setParcelSize(size);
                      setQuote(null);
                    }}
                  >
                    <Text style={[styles.chipText, parcelSize === size && styles.chipTextOn]}>{size}</Text>
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
                placeholder="Recipient phone +639…"
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                keyboardType="phone-pad"
              />
            </>
          ) : null}

          <Text style={styles.section}>Pay</Text>
          <View style={styles.rowWrap}>
            {(["cod", "online"] as const).map((method) => (
              <Pressable
                key={method}
                style={[styles.chip, paymentMethod === method && styles.chipOn]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.chipText, paymentMethod === method && styles.chipTextOn]}>
                  {method === "cod" ? "Cash" : "Online intent"}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View>
            <Text style={styles.fareLabel}>{quote ? "Quoted fare" : "Estimate"}</Text>
            <Text style={styles.fare}>₱{(fare?.fare ?? 0).toFixed(2)}</Text>
            {quote ? (
              <Text style={styles.fareSplit}>
                Platform ₱{Number(quote.platformFee).toFixed(2)} · Rider ₱
                {Number(quote.riderEarning).toFixed(2)}
              </Text>
            ) : (
              <Text style={styles.fareSplit}>Get a server quote to book</Text>
            )}
          </View>
          {quote ? (
            <Pressable style={styles.cta} onPress={confirm} disabled={loading}>
              <Text style={styles.ctaText}>{loading ? "Booking…" : "Book"}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.cta} onPress={loadQuote} disabled={loading}>
              <Text style={styles.ctaText}>{loading ? "Quoting…" : "Get fare"}</Text>
            </Pressable>
          )}
        </View>
        {message ? <Text style={styles.error}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#d7e6d8" },
  back: {
    position: "absolute",
    left: 16,
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 18, fontWeight: "800", color: theme.colors.brandDeep },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "32%",
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.brandDeep },
  sub: { color: theme.colors.muted, marginTop: 4, marginBottom: 12 },
  row: { gap: 8, paddingBottom: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f3f4f2",
  },
  chipOn: { backgroundColor: theme.colors.brand },
  chipText: { fontWeight: "700", color: theme.colors.ink },
  chipTextOn: { color: theme.colors.white },
  stopRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  dotA: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.brand },
  dotB: { width: 12, height: 12, borderRadius: 3, backgroundColor: theme.colors.accent },
  connector: { width: 2, height: 10, backgroundColor: theme.colors.line, marginLeft: 5 },
  stopLabel: { fontSize: 11, fontWeight: "700", color: theme.colors.muted, textTransform: "uppercase" },
  stopValue: { fontWeight: "800", color: theme.colors.ink, marginTop: 2 },
  section: { marginTop: 14, marginBottom: 8, fontWeight: "800", color: theme.colors.brandDeep },
  place: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  placeOn: { backgroundColor: "#eef3ee", marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 },
  placeName: { fontWeight: "800", color: theme.colors.ink },
  placeMeta: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  fareLabel: { fontSize: 11, fontWeight: "700", color: theme.colors.muted, textTransform: "uppercase" },
  fare: { fontSize: 22, fontWeight: "800", color: theme.colors.brandDeep },
  fareSplit: { color: theme.colors.muted, fontSize: 11, marginTop: 2 },
  cta: {
    backgroundColor: theme.colors.brand,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: theme.colors.white, fontWeight: "800", fontSize: 16 },
  error: { color: theme.colors.danger, marginTop: 8, fontWeight: "600" },
});
