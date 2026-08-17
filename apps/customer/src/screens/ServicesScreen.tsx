import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { verifiedBadgeLabel } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

type Profile = Tables<"profiles">;

export function ServicesScreen({
  onOpenRide,
  onOpenPadala,
  onOpenFood,
  onOpenActivity,
  onOpenVerify,
}: {
  onOpenRide: () => void;
  onOpenPadala: () => void;
  onOpenFood: () => void;
  onOpenActivity: () => void;
  onOpenVerify: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(data);
    })();
  }, []);

  const badge = profile ? verifiedBadgeLabel(profile.verification_level) : null;

  function tile(
    title: string,
    subtitle: string,
    onPress: () => void,
    primary = false,
  ) {
    return (
      <Pressable
        style={[styles.tile, primary ? styles.tilePrimary : styles.tileSecondary]}
        onPress={onPress}
      >
        <Text style={[styles.tileTitle, primary && styles.tileTitleOn]}>
          {title}
        </Text>
        <Text style={[styles.tileSub, primary && styles.tileSubOn]}>
          {subtitle}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Bolantero</Text>
          <Text style={styles.sub}>Ride · Padala · Food · SK cities</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onOpenVerify}>
            <Text style={styles.link}>Verify</Text>
          </Pressable>
          <Pressable onPress={onOpenActivity}>
            <Text style={styles.link}>Activity</Text>
          </Pressable>
        </View>
      </View>

      {tile("Ride", "Motorcycle taxi, A to B", onOpenRide, true)}
      {tile("Padala", "Send a package across town", onOpenPadala, true)}
      {tile("Food", "Phase 1 merchants — unchanged", onOpenFood, false)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 16, gap: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
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
  tile: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  tilePrimary: { backgroundColor: theme.colors.brand },
  tileSecondary: { backgroundColor: theme.colors.bgElevated },
  tileTitle: { fontSize: 22, fontWeight: "800", color: theme.colors.ink },
  tileTitleOn: { color: theme.colors.white },
  tileSub: { marginTop: 6, color: theme.colors.muted, fontWeight: "600" },
  tileSubOn: { color: "#d7e8dc" },
});
