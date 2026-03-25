import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { colors } from "../theme/colors";
import { CrossIcon, GoogleIcon, LogoLight } from "../assets";

type SignUpScreenProps = {
  onBack: () => void;
  onSignIn: () => void;
  onSubmit: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => void | Promise<void>;
};

export function SignUpScreen({ onBack, onSignIn, onSubmit }: SignUpScreenProps) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Completează toate câmpurile.");
      return;
    }
    setError(null);
    Promise.resolve(
      onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password
      })
    ).catch((e) => {
      setError(e instanceof Error ? e.message : "Nu am putut crea contul.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.close}>
            <CrossIcon style={styles.closeIcon} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.brand}>
            <LogoLight style={styles.logo} />
            <Text style={styles.brandText}>CitySafe</Text>
          </View>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Prenume"
              placeholderTextColor={colors.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Nume"
              placeholderTextColor={colors.textSecondary}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Parolă"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primary} onPress={submit}>
            <Text style={styles.primaryText}>Înregistrează-te</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>sau</Text>
            <View style={styles.line} />
          </View>

          <Pressable style={styles.secondary} onPress={() => {}}>
            <View style={styles.googleRow}>
              <GoogleIcon style={styles.googleIcon} />
              <Text style={styles.secondaryText}>Înregistrează-te cu Google</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.muted}>Ai deja un cont?</Text>
          <Pressable onPress={onSignIn}>
            <Text style={styles.link}>Autentifică-te</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexGrow: 1,
    alignItems: "center"
  },
  topBar: { alignItems: "flex-end", width: "100%" },
  close: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeIcon: { width: 16, height: 16 },
  body: { width: "100%", alignItems: "center", gap: 12, flex: 1, justifyContent: "center" },
  brand: { alignItems: "center", marginTop: 12, marginBottom: 20 },
  logo: { width: 80, height: 80 },
  brandText: { marginTop: 10, fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  input: {
    width: "100%",
    backgroundColor: colors.placeholder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary
  },
  row: { flexDirection: "row", gap: 10, width: "100%" },
  inputHalf: { flex: 1, width: "auto" },
  primary: {
    marginTop: 10,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    width: "100%"
  },
  primaryText: { fontWeight: "700", color: colors.textPrimary },
  error: { color: "#b91c1c" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8
  },
  line: { flex: 1, height: 1, backgroundColor: colors.textSecondary },
  dividerText: { color: colors.textSecondary, fontWeight: "600" },
  secondary: {
    marginTop: 2,
    backgroundColor: colors.placeholder,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    width: "100%"
  },
  googleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  googleIcon: { width: 24, height: 14 },
  secondaryText: { color: colors.textSecondary, fontWeight: "600" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  muted: { color: colors.textSecondary },
  link: { color: colors.accent, fontWeight: "700" }
});
