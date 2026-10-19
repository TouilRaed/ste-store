import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { theme } from "../../lib/theme";

/**
 * Hairline glyph tabs — no icon set to ship, and the glyphs read at a glance
 * once the active one is the brand blue.
 */
function TabGlyph({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 18, lineHeight: 21 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.blue },
        headerTitleStyle: { color: theme.white, fontSize: 17, fontWeight: "600" },
        headerTintColor: theme.white,
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.blue,
        tabBarInactiveTintColor: theme.inkMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.line,
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: "500" },
        sceneStyle: { backgroundColor: theme.canvas },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Tableau de bord",
          tabBarLabel: "Activité",
          tabBarIcon: ({ color }) => <TabGlyph glyph="◈" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Commandes",
          tabBarLabel: "Commandes",
          tabBarIcon: ({ color }) => <TabGlyph glyph="▤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Produits",
          tabBarLabel: "Produits",
          tabBarIcon: ({ color }) => <TabGlyph glyph="◇" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Réglages",
          tabBarLabel: "Réglages",
          tabBarIcon: ({ color }) => <TabGlyph glyph="⚙" color={color} />,
        }}
      />
    </Tabs>
  );
}
