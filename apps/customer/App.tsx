import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import type { Tables } from "@bolantero/database";
import type { TripServiceType } from "@bolantero/shared";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { ServicesScreen } from "./src/screens/ServicesScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MerchantScreen } from "./src/screens/MerchantScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { VerifyScreen } from "./src/screens/VerifyScreen";
import { BookTripScreen } from "./src/screens/BookTripScreen";
import { TripTrackScreen } from "./src/screens/TripTrackScreen";
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { TabBar } from "./src/ui/TabBar";
import { upsertCartItem, type CartItem } from "./src/state/cart";
import { supabase } from "./src/lib/supabase";

type Merchant = Tables<"merchants">;
type Screen =
  | "login"
  | "register"
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

  const authed = screen !== "login" && screen !== "register";
  const mapScreen = screen === "services" || screen === "book" || screen === "track";
  const showTabs = screen === "services" || screen === "activity" || screen === "verify";

  const body = (
    <>
      {screen === "login" ? (
        <LoginScreen
          onAuthed={() => setScreen("services")}
          onCreateAccount={() => setScreen("register")}
        />
      ) : null}
      {screen === "register" ? (
        <RegisterScreen
          onAuthed={() => setScreen("services")}
          onHaveAccount={() => setScreen("login")}
        />
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
        <VerifyScreen onBack={() => setScreen("services")} showBack={false} />
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
        <TripTrackScreen tripId={tripId} onBack={() => setScreen("activity")} />
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
    </>
  );

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: mapScreen ? "#d7e6d8" : "#f4f5f3" }}>
        <StatusBar style={mapScreen || screen === "register" ? "dark" : "dark"} />
        {mapScreen || screen === "login" || screen === "register" ? (
          <View style={{ flex: 1 }}>{body}</View>
        ) : (
          <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f5f3" }}>{body}</SafeAreaView>
        )}
        {authed && showTabs ? (
          <TabBar
            active={screen === "activity" ? "activity" : screen === "verify" ? "account" : "home"}
            onHome={() => setScreen("services")}
            onActivity={() => setScreen("activity")}
            onAccount={() => setScreen("verify")}
          />
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}
