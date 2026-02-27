import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { API_BASE_URL } from "../config";
import { City, getCities } from "../api";
import { colors } from "../theme/colors";

export function CitiesScreen() {
  const [cities, setCities] = React.useState<City[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const data = await getCities();
      setCities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cities");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading cities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Cities</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={cities}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cityName}>{item.name}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !error ? <Text style={styles.muted}>No cities yet.</Text> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        contentContainerStyle={cities.length === 0 ? styles.emptyContainer : undefined}
      />
      <Text style={styles.baseUrl}>{`API: ${API_BASE_URL}`}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
    padding: 20
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
    color: colors.textPrimary
  },
  row: {
    paddingVertical: 14
  },
  cityName: {
    fontSize: 18,
    color: colors.textPrimary
  },
  separator: {
    height: 1,
    backgroundColor: colors.border
  },
  muted: {
    color: colors.textSecondary
  },
  error: {
    color: "#b91c1c",
    marginBottom: 8
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center"
  },
  baseUrl: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary
  }
});
