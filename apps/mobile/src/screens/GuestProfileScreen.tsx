import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { CrossIcon, SettingsIcon } from "../assets";
import { colors } from "../theme/colors";

type GuestProfileScreenProps = {
  onBack: () => void;
  onSignIn: () => void;
};

export function GuestProfileScreen({ onBack, onSignIn }: GuestProfileScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.close}>
          <CrossIcon style={styles.closeIcon} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Image source={require("../assets/avatar.png")} style={styles.avatarImage} />
            </View>
            <Text style={styles.name}>Guest</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.list}>
            <View style={styles.listItem}>
              <View style={styles.iconBox}>
                <SettingsIcon style={styles.listIcon} />
              </View>
              <Text style={styles.listText}>Settings and privacy</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.primary} onPress={onSignIn}>
          <Text style={styles.primaryText}>Sign in</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  header: { alignItems: "flex-end" },
  close: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeIcon: { width: 16, height: 16 },
  content: { flex: 1, justifyContent: "space-between", paddingTop: 8 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  avatarImage: { width: 52, height: 52, resizeMode: "cover" },
  name: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.textSecondary, marginVertical: 16 },
  list: { gap: 16 },
  listItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  listIcon: { width: 18, height: 18 },
  listText: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    width: "100%"
  },
  primaryText: { fontWeight: "700", color: colors.textPrimary }
});
