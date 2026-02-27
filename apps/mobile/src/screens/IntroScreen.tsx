import React from "react";
import { SafeAreaView, StyleSheet, Text, View, StatusBar } from "react-native";
import { colors } from "../theme/colors";
import { LogoDark } from "../assets";

export function IntroScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.accent} barStyle="dark-content" />
      <View style={styles.center}>
        <LogoDark style={styles.logo} />
        <Text style={styles.title}>CitySafe</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: 20
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary
  }
});
