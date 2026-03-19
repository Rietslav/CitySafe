import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import MapLibreGL from "@maplibre/maplibre-react-native";
import { getReports, type Report } from "../api";
import { colors } from "../theme/colors";
import { AddIcon, MenuButtonIcon } from "../assets";
import { ReportDetailScreen } from "./ReportDetailScreen";

type MapScreenProps = {
  onOpenReport: () => void;
  onOpenProfile: () => void;
  feedVersion: number;
  canSupportReports: boolean;
};

export function MapScreen({ onOpenReport, onOpenProfile, feedVersion, canSupportReports }: MapScreenProps) {
  const center = [28.8638, 47.0105] as [number, number];
  const initialCamera = {
    centerCoordinate: center,
    zoomLevel: 13
  };

  const [reports, setReports] = React.useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = React.useState(false);
  const [reportsError, setReportsError] = React.useState<string | null>(null);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);

  const loadReports = React.useCallback(async () => {
    setReportsError(null);
    setLoadingReports(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : "Nu am putut încărca sesizările.");
    } finally {
      setLoadingReports(false);
    }
  }, []);

  React.useEffect(() => {
    loadReports();
  }, [loadReports, feedVersion]);

  const reportsWithCoordinates = React.useMemo(
    () =>
      reports.filter(
        (report) => Boolean(report.coordinate) && ["NEW", "IN_PROGRESS"].includes(report.status)
      ),
    [reports]
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.mapWrapper}>
        <MapLibreGL.MapView
          style={styles.map}
          mapStyle={OSM_RASTER_STYLE}
          attributionEnabled
          logoEnabled={false}
          compassViewMargins={COMPASS_MARGINS}
          onPress={() => setSelectedReport(null)}
        >
          <MapLibreGL.Camera defaultSettings={initialCamera} />
          {reportsWithCoordinates.map((report) => {
            const coordinate = report.coordinate!;
            return (
              <MapLibreGL.PointAnnotation
                key={`report-${report.id}`}
                id={`report-${report.id}`}
                coordinate={[Number(coordinate.longitude), Number(coordinate.latitude)]}
                onSelected={() => setSelectedReport(report)}
              >
                <View style={styles.reportMarkerOuter}>
                  <View style={styles.reportMarkerInner} />
                </View>
              </MapLibreGL.PointAnnotation>
            );
          })}
        </MapLibreGL.MapView>
      </View>

      <Pressable style={styles.menuButton} onPress={onOpenProfile}>
        <MenuButtonIcon style={styles.menuIcon} />
      </Pressable>

      <Pressable style={styles.fab} onPress={onOpenReport}>
        <AddIcon style={styles.fabIcon} />
      </Pressable>

      {loadingReports ? (
        <View style={styles.statusChip}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <Text style={styles.statusText}>Se încarcă sesizările...</Text>
        </View>
      ) : null}

      {reportsError ? (
        <View style={[styles.statusChip, styles.statusErrorChip]}>
          <Text style={[styles.statusText, styles.statusErrorText]} numberOfLines={2}>
            {reportsError}
          </Text>
          <Pressable onPress={loadReports}>
            <Text style={styles.retryText}>Reîncearcă</Text>
          </Pressable>
        </View>
      ) : null}

      {selectedReport ? (
        <ReportDetailScreen
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          canSupport={canSupportReports}
        />
      ) : null}
    </SafeAreaView>
  );
}

const COMPASS_MARGINS = { x: 16, y: 72 } as const; // keep compass tappable below system UI

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapWrapper: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },

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
  fabIcon: { width: 28, height: 28 },

  reportMarkerOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0, 166, 166, 0.25)",
    alignItems: "center",
    justifyContent: "center"
  },
  reportMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent
  },
  statusChip: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 112,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6
  },
  statusErrorChip: {
    top: 162
  },
  statusText: { color: colors.textSecondary, flex: 1 },
  statusErrorText: { color: "#b91c1c" },
  retryText: { color: colors.accent, fontWeight: "700" }
});

const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm"
    }
  ]
} as const;
