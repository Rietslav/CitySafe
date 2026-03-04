import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, View } from "react-native";

import MapLibreGL from "@maplibre/maplibre-react-native";
import { colors } from "../theme/colors";
import { AddIcon, MenuButtonIcon } from "../assets";

type MapScreenProps = {
  onOpenReport: () => void;
  onOpenProfile: () => void;
};

export function MapScreen({ onOpenReport, onOpenProfile }: MapScreenProps) {
  const center = [28.8638, 47.0105] as [number, number];
  const initialCamera = {
    centerCoordinate: center,
    zoomLevel: 13
  };
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.mapWrapper}>
        <MapLibreGL.MapView style={styles.map} mapStyle={OSM_RASTER_STYLE} attributionEnabled>
          <MapLibreGL.Camera defaultSettings={initialCamera} />
        </MapLibreGL.MapView>
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
  fabIcon: { width: 28, height: 28 }
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
