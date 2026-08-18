import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tripServiceLabel, type ServiceAreaCode, type TripStatus } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";
import { MapCanvas } from "../ui/MapCanvas";

type Trip = Tables<"trips">;

const LIVE: TripStatus[] = ["requested", "accepted", "arrived_pickup", "in_progress", "completed"];

export function TripTrackScreen({
  tripId,
  onBack,
}: {
  tripId: string;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("trips").select("*").eq("id", tripId).maybeSingle();
    setTrip(data);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  async function cancel() {
    const { error } = await supabase.rpc("cancel_trip", {
      p_trip_id: tripId,
      p_reason: "customer cancelled",
    });
    setMessage(error ? error.message : "Trip cancelled.");
    await load();
  }

  if (!trip) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 16, paddingHorizontal: 16 }]}>
        <Pressable onPress={onBack}>
          <Text style={styles.link}>← Back</Text>
        </Pressable>
        <Text style={styles.sub}>Finding your trip…</Text>
      </View>
    );
  }

  const stepIndex = LIVE.indexOf(trip.status as TripStatus);

  return (
    <View style={styles.root}>
      <MapCanvas
        area={trip.service_area_code as ServiceAreaCode}
        pickup={{ lat: trip.pickup_lat, lng: trip.pickup_lng, label: trip.pickup_label }}
        dropoff={{ lat: trip.dropoff_lat, lng: trip.dropoff_lng, label: trip.dropoff_label }}
      />
      <Pressable style={[styles.back, { top: Math.max(insets.top, 8) }]} onPress={onBack}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
        <Text style={styles.kicker}>{tripServiceLabel(trip.service_type)}</Text>
        <Text style={styles.title}>{trip.trip_number}</Text>
        <View style={styles.steps}>
          {LIVE.filter((s) => s !== "completed" || trip.status === "completed").map((status, index) => (
            <View key={status} style={styles.step}>
              <View style={[styles.stepDot, stepIndex >= index && styles.stepDotOn]} />
              <Text style={[styles.stepLabel, stepIndex >= index && styles.stepLabelOn]}>
                {status.replace("_", " ")}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.route}>
          {trip.pickup_label} → {trip.dropoff_label}
        </Text>
        <Text style={styles.fare}>₱{Number(trip.fare).toFixed(2)}</Text>
        <Text style={styles.sub}>
          Platform ₱{Number(trip.platform_fee).toFixed(2)} · Rider ₱{Number(trip.rider_earning).toFixed(2)}
        </Text>
        {trip.service_type === "courier" ? (
          <Text style={styles.sub}>
            For {trip.recipient_name} · {trip.parcel_description}
          </Text>
        ) : null}
        {trip.status === "requested" ? (
          <Pressable style={styles.cancel} onPress={cancel}>
            <Text style={styles.cancelText}>Cancel trip</Text>
          </Pressable>
        ) : null}
        {message ? <Text style={styles.sub}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#d7e6d8" },
  link: { color: theme.colors.brand, fontWeight: "800" },
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
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  kicker: { fontWeight: "800", color: theme.colors.brand, textTransform: "uppercase", fontSize: 12 },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.brandDeep, marginTop: 4 },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14, marginBottom: 12 },
  step: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.line },
  stepDotOn: { backgroundColor: theme.colors.brand },
  stepLabel: { fontSize: 11, color: theme.colors.muted, textTransform: "capitalize" },
  stepLabelOn: { color: theme.colors.brandDeep, fontWeight: "700" },
  route: { fontWeight: "700", color: theme.colors.ink },
  fare: { marginTop: 10, fontSize: 22, fontWeight: "800", color: theme.colors.brandDeep },
  sub: { color: theme.colors.muted, marginTop: 4 },
  cancel: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: theme.colors.danger, fontWeight: "800" },
});
