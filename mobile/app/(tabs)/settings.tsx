import { useState } from "react";
import { router } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { clearToken } from "../../lib/auth";
import { lastPushError, registerForOrderPushes, unregisterOrderPushes } from "../../lib/push";
import { API_BASE_URL } from "../../lib/constants";
import { theme, type } from "../../lib/theme";
import { Button, Label, Message, SectionTitle, useBottomInset } from "../../components/ui";

export default function SettingsScreen() {
  const [pushState, setPushState] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const paddingBottom = useBottomInset();

  /**
   * Re-runs registration and reports the outcome on screen. Every failure path
   * used to be a console.warn, which is invisible on a phone — so a device that
   * never registered looked identical to one that had.
   */
  async function checkPush() {
    setChecking(true);
    setPushState(null);
    try {
      const token = await registerForOrderPushes();
      setPushState(
        token
          ? `Activées — ce téléphone recevra les nouvelles commandes.
${token.slice(0, 32)}…`
          : (lastPushError ?? "Échec inconnu."),
      );
    } catch (error) {
      setPushState(error instanceof Error ? error.message : "Échec inconnu.");
    } finally {
      setChecking(false);
    }
  }

  async function signOut() {
    await unregisterOrderPushes();
    await clearToken();
    router.replace("/login");
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom }]}>
      <View style={styles.group}>
        <SectionTitle>Serveur</SectionTitle>
        <Text style={styles.value}>{API_BASE_URL}</Text>
        <Text style={styles.hint}>
          L&apos;adresse de la boutique que cette application pilote.
        </Text>

        <View style={styles.divider} />

        <Label>Boutique</Label>
        <Button
          label="Ouvrir la boutique"
          variant="outline"
          onPress={() => Linking.openURL(API_BASE_URL)}
          style={styles.button}
        />
      </View>

      <View style={styles.group}>
        <SectionTitle>Notifications</SectionTitle>
        <Text style={styles.hint}>
          Une notification arrive à chaque nouvelle commande. Si rien n&apos;arrive, lancez la
          vérification : elle indique précisément ce qui bloque.
        </Text>
        <Button
          label={checking ? "Vérification…" : "Vérifier les notifications"}
          variant="outline"
          onPress={checkPush}
          disabled={checking}
          style={styles.button}
        />
        {pushState ? <Message tone="info">{pushState}</Message> : null}
      </View>

      <View style={styles.group}>
        <SectionTitle>Session</SectionTitle>
        <Text style={styles.hint}>
          Le jeton est conservé dans le trousseau du téléphone et expire au bout de 30 jours. La
          déconnexion arrête aussi les notifications sur cet appareil.
        </Text>
        <Button label="Se déconnecter" variant="danger" onPress={signOut} style={styles.button} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  group: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 18,
    marginBottom: 14,
  },
  value: { marginTop: 8, ...type.body, color: theme.ink },
  hint: { marginTop: 8, ...type.meta, lineHeight: 19, color: theme.inkMuted },
  divider: { height: 1, backgroundColor: theme.lineSoft, marginVertical: 18 },
  button: { marginTop: 14 },
});
