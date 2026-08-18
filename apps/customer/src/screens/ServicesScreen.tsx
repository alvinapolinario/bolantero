import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LANDMARKS, SERVICE_AREAS, verifiedBadgeLabel } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";
import { MapCanvas } from "../ui/MapCanvas";

type Profile = Tables<"profiles">;

export function ServicesScreen({
  onOpenRide,
  onOpenPadala,
  onOpenFood,
}: {
  onOpenRide: () => void;
  onOpenPadala: () => void;
  onOpenFood: () => void;
  onOpenActivity: () => void;
  onOpenVerify: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(data);
    })();
  }, []);

  const badge = profile ? verifiedBadgeLabel(profile.verification_level) : null;
  const hello = profile?.display_name?.split(" ")[0] ?? "there";
  const suggestions = LANDMARKS.slice(0, 4);

  return (
    <View style={styles.root}>
      <MapCanvas area="tacurong" />
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.topCard}>
          <Text style={styles.hello}>Hi, {hello}</Text>
          <Text style={styles.cityLine}>{SERVICE_AREAS.map((a) => a.name).join(" · ")}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Pressable style={styles.where} onPress={onOpenRide} accessibilityRole="button">
          <View style={styles.whereDot} />
          <Text style={styles.whereText}>Where to?</Text>
        </Pressable>
        <View style={styles.services}>
          <Service icon="Ride" hint="Motorcycle" onPress={onOpenRide} primary />
          <Service icon="Padala" hint="Send item" onPress={onOpenPadala} />
          <Service icon="Food" hint="Nearby" onPress={onOpenFood} />
        </View>
        <Text style={styles.section}>Suggested places</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestRow}>
          {suggestions.map((place) => (
            <Pressable key={place.label} style={styles.place} onPress={onOpenRide}>
              <Text style={styles.placeName}>{place.label}</Text>
              <Text style={styles.placeCity}>{place.city}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function Service({
  icon,
  hint,
  onPress,
  primary,
}: {
  icon: string;
  hint: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable style={styles.service} onPress={onPress}>
      <View style={[styles.serviceIcon, primary && styles.serviceIconOn]}>
        <Text style={[styles.serviceGlyph, primary && styles.serviceGlyphOn]}>{icon[0]}</Text>
      </View>
      <Text style={styles.serviceName}>{icon}</Text>
      <Text style={styles.serviceHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#d7e6d8" },
  top: { position: "absolute", left: 16, right: 16, zIndex: 2 },
  topCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hello: { fontSize: 18, fontWeight: "800", color: theme.colors.brandDeep },
  cityLine: { color: theme.colors.muted, marginTop: 2, fontSize: 12, fontWeight: "600" },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#e4efe7",
    color: theme.colors.brandDeep,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "700",
    fontSize: 11,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 12,
  },
  where: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f2",
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    gap: 10,
  },
  whereDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.brand,
  },
  whereText: { fontSize: 16, fontWeight: "700", color: theme.colors.muted },
  services: { flexDirection: "row", marginTop: 16, gap: 8 },
  service: { flex: 1, alignItems: "center" },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#eef3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceIconOn: { backgroundColor: theme.colors.brand },
  serviceGlyph: { fontWeight: "800", fontSize: 18, color: theme.colors.brandDeep },
  serviceGlyphOn: { color: theme.colors.white },
  serviceName: { marginTop: 8, fontWeight: "800", color: theme.colors.ink },
  serviceHint: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  section: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "800",
    color: theme.colors.brandDeep,
    fontSize: 13,
  },
  suggestRow: { gap: 8, paddingBottom: 4 },
  place: {
    backgroundColor: "#f3f4f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 120,
  },
  placeName: { fontWeight: "800", color: theme.colors.ink },
  placeCity: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
});
