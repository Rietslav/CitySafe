import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { toggleReportLike, type Report } from "../api";
import { colors } from "../theme/colors";

type ReportDetailScreenProps = {
  report: Report;
  onClose: () => void;
  canSupport: boolean;
};

function formatStatus(status: Report["status"]) {
  switch (status) {
    case "WAITING":
      return "În așteptare";
    case "NEW":
      return "Nouă";
    case "IN_PROGRESS":
      return "În lucru";
    case "RESOLVED":
      return "Rezolvată";
    case "REJECTED":
      return "Respinsă";
    default:
      return status;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function ReportDetailScreen({ report, onClose, canSupport }: ReportDetailScreenProps) {
  const [supporters, setSupporters] = React.useState(report._count?.likes ?? 0);
  const [liked, setLiked] = React.useState(Boolean(report.viewerHasLiked));
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setSupporters(report._count?.likes ?? 0);
    setLiked(Boolean(report.viewerHasLiked));
  }, [report]);

  const handleToggleLike = React.useCallback(async () => {
    if (pending || !canSupport) return;
    setPending(true);
    try {
      const response = await toggleReportLike(report.id);
      setSupporters(response.count);
      setLiked(response.liked);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nu am putut actualiza susținerea.";
      Alert.alert("Eroare", message);
    } finally {
      setPending(false);
    }
  }, [pending, report.id, canSupport]);

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportCardHeader}>
        <Text style={styles.reportCardTitle} numberOfLines={1}>
          {report.title?.trim().length
            ? report.title.trim()
            : report.category?.name ?? "Sesizare"}
        </Text>
        <Pressable onPress={onClose}>
          <Text style={styles.closeText}>Închide</Text>
        </Pressable>
      </View>

      <Text style={styles.reportMeta}>
        {[
          report.category?.name,
          report.city?.name,
          formatStatus(report.status),
          formatDate(report.createdAt)
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>

      <View style={styles.supportRow}>
        <Text style={styles.supportersLabel}>
          Susținători: <Text style={styles.supportersCount}>{supporters}</Text>
        </Text>
        {canSupport ? (
          <Pressable
            onPress={handleToggleLike}
            style={({ pressed }) => [
              styles.likeButton,
              liked && styles.likeButtonActive,
              pressed && !pending ? styles.likeButtonPressed : null
            ]}
            accessibilityRole="button"
            accessibilityLabel="Susține raportul"
            disabled={pending}
          >
            <Text style={[styles.likeIcon, liked && styles.likeIconActive]}>
              {liked ? "❤" : "♡"}
            </Text>
            <Text style={[styles.likeText, liked && styles.likeTextActive]}>
              {liked ? "Susținut" : "Susține"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {report.description?.trim() ? (
        <Text style={styles.reportDescription}>{report.description.trim()}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  reportCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 32,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8
  },
  reportCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  reportCardTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  closeText: { color: colors.accent, fontWeight: "700" },
  reportMeta: { color: colors.textSecondary, marginTop: 6, fontSize: 12 },
  supportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 12
  },
  supportersLabel: { color: colors.textSecondary, fontSize: 12 },
  supportersCount: { color: colors.textPrimary, fontWeight: "700" },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.textPrimary
  },
  likeButtonActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(0,168,168,0.08)"
  },
  likeButtonPressed: { opacity: 0.8 },
  likeIcon: { fontSize: 16, color: colors.textPrimary },
  likeIconActive: { color: colors.accent },
  likeText: { fontWeight: "600", color: colors.textPrimary },
  likeTextActive: { color: colors.accent },
  reportDescription: { color: colors.textPrimary, marginTop: 8, lineHeight: 20 }
});
