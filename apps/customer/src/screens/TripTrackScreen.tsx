import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tripServiceLabel } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Trip = Tables<"trips">;

export function TripTrackScreen({
  tripId,
  onBack,
}: {
  tripId: string;
  onBack: () => void;
}) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();
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
      <View style={styles.container}>
        <Pressable onPress={onBack}>
          <Text style={styles.link}>← Back</Text>
        </Pressable>
        <Text style={styles.sub}>Loading trip…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Activity</Text>
      </Pressable>
      <Text style={styles.title}>{trip.trip_number}</Text>
      <Text style={styles.sub}>
        {tripServiceLabel(trip.service_type)} · {trip.status}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {trip.pickup_label} → {trip.dropoff_label}
        </Text>
        <Text style={styles.sub}>
          {trip.pickup_line1}, {trip.pickup_barangay}
        </Text>
        <Text style={styles.sub}>
          {trip.dropoff_line1}, {trip.dropoff_barangay}
        </Text>
        <Text style={styles.total}>Fare ₱{Number(trip.fare).toFixed(2)}</Text>
        <Text style={styles.sub}>
          Platform ₱{Number(trip.platform_fee).toFixed(2)} · Rider ₱
          {Number(trip.rider_earning).toFixed(2)}
        </Text>
        {trip.service_type === "courier" ? (
          <Text style={styles.sub}>
            For {trip.recipient_name} · {trip.parcel_description}
          </Text>
        ) : null}
      </View>

      {trip.status === "requested" ? (
        <Pressable style={styles.btn} onPress={cancel}>
          <Text style={styles.btnText}>Cancel trip</Text>
        </Pressable>
      ) : null}
      {message ? <Text style={styles.sub}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 16 },
  link: { color: theme.colors.brand, fontWeight: "800", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: theme.colors.brandDeep },
  sub: { color: theme.colors.muted, marginTop: 4 },
  card: {
    marginTop: 16,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },
  total: { marginTop: 8, fontWeight: "800", fontSize: 18, color: theme.colors.brandDeep },
  btn: {
    marginTop: 16,
    backgroundColor: theme.colors.danger,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
