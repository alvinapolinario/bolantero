import { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import type { Tables } from "@bolantero/database";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MerchantScreen } from "./src/screens/MerchantScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { VerifyScreen } from "./src/screens/VerifyScreen";
import { upsertCartItem, type CartItem } from "./src/state/cart";
import { supabase } from "./src/lib/supabase";
import { theme } from "./src/theme";

type Merchant = Tables<"merchants">;
type Screen =
  | "login"
  | "home"
  | "merchant"
  | "cart"
  | "orders"
  | "verify"
  | "tracking";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setScreen("home");
    });
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <StatusBar style="dark" />
        {screen === "login" ? (
          <LoginScreen onAuthed={() => setScreen("home")} />
        ) : null}
        {screen === "home" ? (
          <HomeScreen
            onOpenMerchant={(m) => {
              setMerchant(m);
              setScreen("merchant");
            }}
            onOpenCart={() => setScreen("cart")}
            onOpenOrders={() => setScreen("orders")}
            onOpenVerify={() => setScreen("verify")}
          />
        ) : null}
        {screen === "merchant" && merchant ? (
          <MerchantScreen
            merchant={merchant}
            onBack={() => setScreen("home")}
            onAdd={(item) => setCart((prev) => upsertCartItem(prev, item))}
          />
        ) : null}
        {screen === "cart" ? (
          <CartScreen
            items={cart}
            onBack={() => setScreen("home")}
            onPlaced={() => {
              setCart([]);
              setScreen("orders");
            }}
          />
        ) : null}
        {screen === "orders" ? (
          <OrdersScreen onBack={() => setScreen("home")} />
        ) : null}
        {screen === "verify" ? (
          <VerifyScreen onBack={() => setScreen("home")} />
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
