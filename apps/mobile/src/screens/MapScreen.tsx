import React from "react";
import { Image, Pressable, SafeAreaView, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { AddIcon, MenuButtonIcon } from "../assets";

type MapScreenProps = {
  onOpenReport: () => void;
  onOpenProfile: () => void;
};

export function MapScreen({ onOpenReport, onOpenProfile }: MapScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapWrapper}>
        <Image source={require("../assets/map.png")} style={styles.map} />
      </View>

      <Pressable style={styles.menuButton} onPress={onOpenProfile}>
        <MenuButtonIcon style={styles.menuIcon} />
      </Pressable>

      <Pressable style={styles.fab} onPress={onOpenReport}>
        <AddIcon style={styles.fabIcon} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapWrapper: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject, resizeMode: "cover" },

  menuButton: {
    position: "absolute",
    top: 48,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4
  },
  menuIcon: { width: 24, height: 24 },

  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4
  },
  fabIcon: { width: 28, height: 28 }
});
