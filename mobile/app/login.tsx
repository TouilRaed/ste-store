import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import { API_BASE_URL } from "../lib/constants";
import { theme, type } from "../lib/theme";
import { BRAND } from "../lib/brand";
import { Button, Field, Message } from "../components/ui";

/**
 * One field and one button, on the brand blue.
 *
 * It used to be a white card floating on a pale wash — the look every admin
 * template ships with. The shop's mark on its own colour says whose tool this
 * is before a word is read.
 */
export default function LoginScreen() {
  // This screen hides the header, so nothing else keeps the content clear of
  // the status bar and the gesture bar on an edge-to-edge Android device.
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
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require("../assets/icon.png")} style={styles.mark} />
        <Text style={styles.brand}>{BRAND.NAME}</Text>
        <Text style={styles.role}>Espace de gestion</Text>

        <View style={styles.sheet}>
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
        </View>

        <Text style={styles.server}>{API_BASE_URL.replace(/^https?:\/\//, "")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.blue },
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 },
  mark: { width: 56, height: 56, borderRadius: 14, alignSelf: "center" },
  brand: { ...type.screenTitle, color: theme.white, textAlign: "center", marginTop: 16 },
  role: { ...type.body, color: "rgba(255,255,255,0.75)", textAlign: "center", marginTop: 4 },
  sheet: {
    marginTop: 32,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
  },
  button: { marginTop: 4 },
  server: { marginTop: 24, textAlign: "center", ...type.meta, color: "rgba(255,255,255,0.65)" },
});
