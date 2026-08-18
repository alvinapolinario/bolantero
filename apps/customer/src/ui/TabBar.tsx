import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

export type CustomerTab = "home" | "activity" | "account";

export function TabBar({
  active,
  onHome,
  onActivity,
  onAccount,
}: {
  active: CustomerTab;
  onHome: () => void;
  onActivity: () => void;
  onAccount: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Tab label="Home" selected={active === "home"} onPress={onHome} />
      <Tab label="Activity" selected={active === "activity"} onPress={onActivity} />
      <Tab label="Account" selected={active === "account"} onPress={onAccount} />
    </View>
  );
}

function Tab({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected }}>
      <View style={[styles.mark, selected && styles.markOn]} />
      <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: theme.colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", minHeight: 44, justifyContent: "center" },
  mark: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 6,
  },
  markOn: { backgroundColor: theme.colors.brand },
  label: { fontSize: 11, fontWeight: "700", color: theme.colors.muted },
  labelOn: { color: theme.colors.brandDeep },
});
