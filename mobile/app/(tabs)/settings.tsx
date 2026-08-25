import { router } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { clearToken } from "../../lib/auth";
import { unregisterOrderPushes } from "../../lib/push";
import { API_BASE_URL } from "../../lib/constants";
import { theme } from "../../lib/theme";
import { Button, Card, Eyebrow } from "../../components/ui";

export default function SettingsScreen() {
  async function signOut() {
    await unregisterOrderPushes();
    await clearToken();
    router.replace("/login");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Eyebrow>Server</Eyebrow>
        <Text style={styles.value}>{API_BASE_URL}</Text>
        <Text style={styles.hint}>
          Set with EXPO_PUBLIC_API_BASE_URL, or expo.extra.apiBaseUrl in app.json. On a physical device use
          your computer&apos;s LAN address, not localhost.
        </Text>

        <View style={styles.divider} />

        <Eyebrow>Storefront</Eyebrow>
        <Button
          label="Ouvrir la boutique"
          variant="outline"
          onPress={() => Linking.openURL(API_BASE_URL)}
          style={styles.button}
        />
      </Card>

      <Card style={styles.card}>
        <Eyebrow>Session</Eyebrow>
        <Text style={styles.hint}>
          The token is kept in the device keychain and expires after 30 days. Signing out also stops
          new-order notifications on this device.
        </Text>
        <Button label="Se déconnecter" variant="danger" onPress={signOut} style={styles.button} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  card: { padding: 20, marginBottom: 16 },
  value: { marginTop: 10, fontSize: 15, color: theme.ink },
  hint: { marginTop: 10, fontSize: 12, lineHeight: 18, color: theme.inkMuted },
  divider: { height: 1, backgroundColor: theme.line, marginVertical: 20 },
  button: { marginTop: 16 },
});
