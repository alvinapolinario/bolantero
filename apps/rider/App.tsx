import { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./src/screens/LoginScreen";
import { JobsScreen } from "./src/screens/JobsScreen";
import { EarningsScreen } from "./src/screens/EarningsScreen";
import { supabase } from "./src/lib/supabase";
import { theme } from "./src/theme";

type Screen = "login" | "jobs" | "earnings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setScreen("jobs");
    });
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <StatusBar style="dark" />
        {screen === "login" ? (
          <LoginScreen onAuthed={() => setScreen("jobs")} />
        ) : null}
        {screen === "jobs" ? (
          <JobsScreen onOpenEarnings={() => setScreen("earnings")} />
        ) : null}
        {screen === "earnings" ? (
          <EarningsScreen onBack={() => setScreen("jobs")} />
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
