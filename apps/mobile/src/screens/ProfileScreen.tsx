import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { CrossIcon } from "../assets";

type ProfileScreenProps = {
  onBack: () => void;
  onSignIn: () => void;
};

export function ProfileScreen({ onBack, onSignIn }: ProfileScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <Pressable onPress={onBack} style={styles.close}>
          <CrossIcon style={styles.closeIcon} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>V</Text>
          </View>
          <Text style={styles.name}>Vizitator</Text>
          <Text style={styles.muted}>Explorezi aplicația ca vizitator.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cont</Text>
          <Text style={styles.muted}>
            Autentifică-te pentru a salva rapoarte și a-ți sincroniza activitatea.
          </Text>
        </View>

        <Pressable style={styles.primary} onPress={onSignIn}>
          <Text style={styles.primaryText}>Autentifică-te</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  close: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeIcon: { width: 16, height: 16 },
  content: { flex: 1, justifyContent: "space-between", gap: 16 },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    gap: 6
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: colors.textPrimary },
  name: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  muted: { color: colors.textSecondary, textAlign: "center" },
  section: { gap: 6 },
  sectionTitle: { fontWeight: "600", color: colors.textPrimary },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  primaryText: { fontWeight: "700", color: colors.textPrimary }
});
