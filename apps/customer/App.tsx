import { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import type { Tables } from "@bolantero/database";
import type { TripServiceType } from "@bolantero/shared";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ServicesScreen } from "./src/screens/ServicesScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MerchantScreen } from "./src/screens/MerchantScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { VerifyScreen } from "./src/screens/VerifyScreen";
import { BookTripScreen } from "./src/screens/BookTripScreen";
import { TripTrackScreen } from "./src/screens/TripTrackScreen";
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { upsertCartItem, type CartItem } from "./src/state/cart";
import { supabase } from "./src/lib/supabase";
import { theme } from "./src/theme";

type Merchant = Tables<"merchants">;
type Screen =
  | "login"
  | "services"
  | "food"
  | "merchant"
  | "cart"
  | "orders"
  | "verify"
  | "book"
  | "track"
  | "activity";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [serviceType, setServiceType] = useState<TripServiceType>("ride");
  const [tripId, setTripId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setScreen("services");
    });
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <StatusBar style="dark" />
        {screen === "login" ? (
          <LoginScreen onAuthed={() => setScreen("services")} />
        ) : null}
        {screen === "services" ? (
          <ServicesScreen
            onOpenRide={() => {
              setServiceType("ride");
              setScreen("book");
            }}
            onOpenPadala={() => {
              setServiceType("courier");
              setScreen("book");
            }}
            onOpenFood={() => setScreen("food")}
            onOpenActivity={() => setScreen("activity")}
            onOpenVerify={() => setScreen("verify")}
          />
        ) : null}
        {screen === "food" ? (
          <HomeScreen
            onBack={() => setScreen("services")}
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
            onBack={() => setScreen("food")}
            onAdd={(item) => setCart((prev) => upsertCartItem(prev, item))}
          />
        ) : null}
        {screen === "cart" ? (
          <CartScreen
            items={cart}
            onBack={() => setScreen("food")}
            onPlaced={() => {
              setCart([]);
              setScreen("orders");
            }}
          />
        ) : null}
        {screen === "orders" ? (
          <OrdersScreen onBack={() => setScreen("activity")} />
        ) : null}
        {screen === "verify" ? (
          <VerifyScreen onBack={() => setScreen("services")} />
        ) : null}
        {screen === "book" ? (
          <BookTripScreen
            serviceType={serviceType}
            onBack={() => setScreen("services")}
            onBooked={(id) => {
              setTripId(id);
              setScreen("track");
            }}
          />
        ) : null}
        {screen === "track" && tripId ? (
          <TripTrackScreen
            tripId={tripId}
            onBack={() => setScreen("activity")}
          />
        ) : null}
        {screen === "activity" ? (
          <ActivityScreen
            onBack={() => setScreen("services")}
            onOpenTrip={(id) => {
              setTripId(id);
              setScreen("track");
            }}
            onOpenFoodOrders={() => setScreen("orders")}
          />
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
