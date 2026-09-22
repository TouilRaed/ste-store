import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import { API_BASE_URL } from "../lib/constants";
import { theme } from "../lib/theme";
import { BRAND } from "../lib/brand";
import { Button, Card, Eyebrow, Field, Message, Title } from "../components/ui";

export default function LoginScreen() {
  // This screen hides the header, so nothing else keeps the card clear of the
  // status bar and the gesture bar on an edge-to-edge Android device.
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!password) return;
    setPending(true);
    setError(null);
    try {
      const { token } = await api.login(password);
      await setToken(token);
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setPending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Eyebrow>{BRAND.NAME}</Eyebrow>
          <Title>Admin</Title>
          <Text style={styles.copy}>Commandes et catalogue de la série en cours.</Text>

          <View style={styles.form}>
            <Field
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!pending}
              onSubmitEditing={submit}
              returnKeyType="go"
            />

            {error ? <Message tone="error">{error}</Message> : null}

            <Button label="Se connecter" onPress={submit} loading={pending} style={styles.button} />
            <Text style={styles.server}>{API_BASE_URL}</Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.paperDeep },
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 },
  card: { padding: 28 },
  copy: { marginTop: 12, fontSize: 14, lineHeight: 21, color: theme.inkSoft },
  form: { marginTop: 28 },
  button: { marginTop: 12 },
  server: { marginTop: 16, textAlign: "center", fontSize: 11, color: theme.inkMuted },
});
