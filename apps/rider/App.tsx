import { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { JobsScreen } from "./src/screens/JobsScreen";
import { EarningsScreen } from "./src/screens/EarningsScreen";
import { supabase } from "./src/lib/supabase";
import { theme } from "./src/theme";

type Screen = "login" | "register" | "jobs" | "earnings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setScreen("jobs");
    });
  }, []);

  return (
    <SafeAreaProvider>
      {screen === "login" || screen === "register" ? (
        <>
          <StatusBar style="light" />
          {screen === "login" ? (
            <LoginScreen
              onAuthed={() => setScreen("jobs")}
              onCreateAccount={() => setScreen("register")}
            />
          ) : (
            <RegisterScreen
              onAuthed={() => setScreen("jobs")}
              onHaveAccount={() => setScreen("login")}
            />
          )}
        </>
      ) : (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <StatusBar style="dark" />
          {screen === "jobs" ? (
            <JobsScreen onOpenEarnings={() => setScreen("earnings")} />
          ) : null}
          {screen === "earnings" ? (
            <EarningsScreen onBack={() => setScreen("jobs")} />
          ) : null}
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}
