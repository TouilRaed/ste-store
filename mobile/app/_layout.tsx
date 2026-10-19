import * as Notifications from "expo-notifications";
import { Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { loadToken, useAuthToken } from "../lib/auth";
import { registerForOrderPushes } from "../lib/push";
import { theme } from "../lib/theme";
import { Loading } from "../components/ui";

export default function RootLayout() {
  const { token, ready } = useAuthToken();
  const segments = useSegments();

  useEffect(() => {
    void loadToken();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const onLogin = segments[0] === "login";
    if (!token && !onLogin) router.replace("/login");
    if (token && onLogin) router.replace("/(tabs)/dashboard");
  }, [ready, token, segments]);

  // Register for new-order pushes once signed in.
  useEffect(() => {
    if (!token) return;
    registerForOrderPushes().catch((error) => console.warn("[push]", error));
  }, [token]);

  // Tapping a notification opens that order.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { orderNumber?: string };
      if (data?.orderNumber) router.push(`/orders/${data.orderNumber}`);
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {ready ? (
        <Stack
          screenOptions={{
            // The header carries the brand colour so the app reads as one
            // tool rather than a stack of white cards.
            headerStyle: { backgroundColor: theme.blue },
            headerTitleStyle: { color: theme.white, fontSize: 17, fontWeight: "600" },
            headerTintColor: theme.white,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.canvas },
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="orders/[id]" options={{ title: "Commande" }} />
          <Stack.Screen name="products/[id]" options={{ title: "Modifier la pièce" }} />
          <Stack.Screen name="products/new" options={{ title: "Nouvelle pièce" }} />
        </Stack>
      ) : (
        <Loading />
      )}
    </SafeAreaProvider>
  );
}
