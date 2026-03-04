import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { Asset, launchImageLibrary } from "react-native-image-picker";
import { City, Category, getCities, getCategories, createReport } from "../api";
import { colors } from "../theme/colors";
import { AddIcon, CrossIcon, MarkerIcon } from "../assets";

type ReportScreenProps = {
  onBack: () => void;
};

export function ReportScreen({ onBack }: ReportScreenProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [cityId, setCityId] = React.useState<number | null>(null);
  const [categoryId, setCategoryId] = React.useState<number | null>(null);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [photos, setPhotos] = React.useState<Asset[]>([]);
  const center = [28.8638, 47.0105] as [number, number];
  const [selectedCoordinate, setSelectedCoordinate] = React.useState<[number, number]>(center);
  const remainingPhotoSlots = Math.max(0, 3 - photos.length);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [cities, cats] = await Promise.all([getCities(), getCategories()]);
        const chisinau = cities.find((c: City) => c.name === "Chișinău");
        setCityId(chisinau?.id ?? cities[0]?.id ?? null);
        setCategories(cats);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      }
    };
    load();
  }, []);

  const handleRegionDidChange = React.useCallback((feature: any) => {
    const coordinates = feature?.geometry?.coordinates;
    if (Array.isArray(coordinates) && typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
      setSelectedCoordinate([coordinates[0], coordinates[1]]);
    }
  }, []);

  const handlePickPhotos = React.useCallback(async () => {
    if (remainingPhotoSlots <= 0) {
      return;
    }
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
        selectionLimit: Math.max(1, remainingPhotoSlots)
      });

      if (result.didCancel || !result.assets?.length) {
        return;
      }

      const assets = result.assets ?? [];
      const sanitizedAssets = assets.filter((asset): asset is Asset & { uri: string } =>
        Boolean(asset?.uri)
      );

      setPhotos((prev) => {
        const next = [...prev, ...sanitizedAssets];
        return next.slice(0, 3);
      });
    } catch (pickError) {
      console.error("pick photos", pickError);
      setError("Nu am putut accesa galeria. Încearcă din nou.");
    }
  }, [remainingPhotoSlots]);

  const removePhoto = React.useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const submit = async () => {
    if (!title.trim() || !categoryId || !cityId) {
      setError("Alege categoria și completează titlul.");
      return;
    }
    if (!selectedCoordinate) {
      setError("Selectează poziția pe hartă.");
      return;
    }
    setError(null);
    try {
      const formattedPhotos = photos
        .filter((asset): asset is Asset & { uri: string } => Boolean(asset.uri))
        .map((asset, index) => ({
          uri: asset.uri!,
          type: asset.type ?? "image/jpeg",
          name: asset.fileName ?? `report-photo-${index + 1}.jpg`
        }));

      await createReport({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        cityId,
        latitude: selectedCoordinate[1],
        longitude: selectedCoordinate[0],
        photos: formattedPhotos.length ? formattedPhotos : undefined
      });
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit report");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Report</Text>
          <Pressable onPress={onBack} style={styles.close}>
            <CrossIcon style={styles.closeIcon} />
          </Pressable>
        </View>

        <Text style={styles.muted}>Mută harta pentru a fixa punctul raportului</Text>

        <View style={styles.mapCard}>
          <MapLibreGL.MapView
            style={styles.map}
            mapStyle={OSM_RASTER_STYLE}
            attributionEnabled={false}
            logoEnabled={false}
            onRegionDidChange={handleRegionDidChange}
          >
            <MapLibreGL.Camera
              defaultSettings={{
                centerCoordinate: center,
                zoomLevel: 13
              }}
            />
          </MapLibreGL.MapView>
          <View pointerEvents="none" style={styles.centerMarker}>
            <MarkerIcon width={36} height={36} />
          </View>
        </View>

        <View style={styles.coordinatesRow}>
          <Text style={styles.coordinatesLabel}>Coordonate</Text>
          <Text style={styles.coordinatesValue}>
            {selectedCoordinate[1].toFixed(5)}, {selectedCoordinate[0].toFixed(5)}
          </Text>
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={categoryId ?? 0}
            onValueChange={(value) =>
              setCategoryId(value === 0 ? null : Number(value))
            }
          >
            <Picker.Item label="Select a category" value={0} />
            {categories.map((cat) => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Add a short title"
          placeholderTextColor={colors.placeholder}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add more details"
          placeholderTextColor={colors.placeholder}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Fotografii (maxim 3)</Text>
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={`${photo.uri ?? index}`} style={styles.photoPreview}>
              <Image source={{ uri: photo.uri }} style={styles.photoPreviewImage} />
              <Pressable
                accessibilityRole="button"
                style={styles.photoRemove}
                onPress={() => removePhoto(index)}
              >
                <CrossIcon style={styles.photoRemoveIcon} />
              </Pressable>
            </View>
          ))}

          {photos.length < 3 ? (
            <Pressable style={styles.photoCard} onPress={handlePickPhotos} accessibilityRole="button">
              <AddIcon style={styles.plus} />
              <Text style={styles.photoText}>Atinge pentru a încărca</Text>
              <Text style={styles.photoLimit}>{`Disponibile ${remainingPhotoSlots} slot${remainingPhotoSlots === 1 ? "" : "uri"}`}</Text>
            </Pressable>
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.submit} onPress={submit}>
          <Text style={styles.submitText}>Send</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  close: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeIcon: { width: 16, height: 16 },
  muted: { color: colors.textSecondary },
  mapCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 6,
    height: 220,
    position: "relative"
  },
  map: { ...StyleSheet.absoluteFillObject },
  centerMarker: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -18,
    marginTop: -18
  },
  coordinatesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  coordinatesLabel: { fontWeight: "600", color: colors.textSecondary },
  coordinatesValue: { fontVariant: ["tabular-nums"], color: colors.textPrimary },
  label: { fontWeight: "600", marginTop: 8, color: colors.textPrimary },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden"
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12
  },
  textArea: { height: 80, textAlignVertical: "top" },
  photoCard: {
    height: 120,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    paddingHorizontal: 12,
    width: "48%"
  },
  plus: { width: 28, height: 28, marginBottom: 6 },
  photoText: { color: colors.textSecondary, textAlign: "center" },
  photoLimit: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  submit: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 6
  },
  submitText: { fontWeight: "700", color: colors.textPrimary },
  error: { color: "#b91c1c", marginTop: 8 },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  photoPreview: {
    width: "48%",
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 6
  },
  photoPreviewImage: {
    width: "100%",
    height: "100%"
  },
  photoRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center"
  },
  photoRemoveIcon: { width: 14, height: 14 }
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
