import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";

import { CrossIcon } from "../assets";
import { getMyReports, type Report } from "../api";
import { colors } from "../theme/colors";

const STATUS_META: Record<
  Report["status"],
  { label: string; tint: string; text: string }
> = {
  WAITING: { label: "În așteptare", tint: "#FFF8EC", text: "#C27803" },
  NEW: { label: "Nou", tint: "#E0F7F7", text: colors.accent },
  IN_PROGRESS: { label: "În lucru", tint: "#FFF0E0", text: "#C27803" },
  RESOLVED: { label: "Rezolvat", tint: "#E6F5EA", text: "#208A43" },
  REJECTED: { label: "Respins", tint: "#FFE8E7", text: "#B42318" }
};

type MyReportsScreenProps = {
  currentUserId: number;
  feedVersion: number;
  onBack: () => void;
  onAddReport: () => void;
};

export function MyReportsScreen({ currentUserId, feedVersion, onBack, onAddReport }: MyReportsScreenProps) {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadReports = React.useCallback(
    async (options?: { skipLoading?: boolean }) => {
      if (!currentUserId) {
        setReports([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!options?.skipLoading) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await getMyReports();
        setReports(data);
      } catch (err) {
        console.error("getMyReports", err);
        setError(err instanceof Error ? err.message : "Nu am putut încărca rapoartele.");
      } finally {
        if (!options?.skipLoading) {
          setLoading(false);
        }
      }
    },
    [currentUserId]
  );

  React.useEffect(() => {
    loadReports();
  }, [loadReports, feedVersion]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadReports({ skipLoading: true });
    setRefreshing(false);
  }, [loadReports]);

  const renderItem: ListRenderItem<Report> = React.useCallback(({ item }) => {
    const status = STATUS_META[item.status] ?? {
      label: item.status,
      tint: "#F1F5F9",
      text: colors.textSecondary
    };
    const formattedDate = new Date(item.createdAt).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={[styles.statusPill, { backgroundColor: status.tint }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.cardDate}>{formattedDate}</Text>
        {item.description ? (
          <Text style={styles.cardDescription}>{item.description}</Text>
        ) : null}
      </View>
    );
  }, []);

  const retry = React.useCallback(() => {
    loadReports();
  }, [loadReports]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.close}>
          <CrossIcon style={styles.closeIcon} />
        </Pressable>
        <Text style={styles.headerTitle}>Rapoartele mele</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, reports.length === 0 ? styles.listEmptyContent : null]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={<EmptyStateView loading={loading} error={error} onRetry={retry} />}
      />

      <Pressable style={styles.primary} onPress={onAddReport}>
        <Text style={styles.primaryText}>Adaugă raport nou</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  close: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeIcon: { width: 16, height: 16, color: colors.textPrimary },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  headerSpacer: { width: 32, height: 32 },
  listContent: { paddingBottom: 32 },
  listEmptyContent: { flexGrow: 1, justifyContent: "center" },
  card: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 18,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(14, 23, 36, 0.05)"
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.textPrimary, paddingRight: 12 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  cardDate: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  cardDescription: { fontSize: 15, color: colors.textPrimary, lineHeight: 20 },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 64,
    gap: 12
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
  emptyDescription: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent
  },
  retryText: { color: colors.accent, fontWeight: "700" },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  primaryText: { fontSize: 16, fontWeight: "700", color: colors.background }
});

type EmptyStateProps = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

function EmptyStateView({ loading, error, onRetry }: EmptyStateProps) {
  if (loading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.emptyTitle}>Se încarcă rapoartele...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Nu am putut încărca rapoartele</Text>
        <Text style={styles.emptyDescription}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Reîncearcă</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Nu ai trimis niciun raport încă</Text>
      <Text style={styles.emptyDescription}>
        Trimite primul raport pentru a urmări progresul și soluțiile propuse de autorități.
      </Text>
    </View>
  );
}
