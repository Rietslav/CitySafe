import React from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { City, Category, getCities, getCategories, createReport } from "../api";
import { colors } from "../theme/colors";
import { AddIcon, CrossIcon } from "../assets";

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

  const submit = async () => {
    if (!title.trim() || !categoryId || !cityId) {
      setError("Alege categoria și completează titlul.");
      return;
    }
    setError(null);
    try {
      await createReport({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        cityId
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

        <Text style={styles.muted}>Your current locations</Text>

        <View style={styles.mapCard}>
          <Image source={require("../assets/report-map.png")} style={styles.mapImage} />
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

        <Pressable style={styles.photoCard}>
          <AddIcon style={styles.plus} />
          <Text style={styles.photoText}>tap to upload</Text>
        </Pressable>

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
  mapCard: { borderRadius: 16, overflow: "hidden", marginTop: 6 },
  mapImage: { width: "100%", height: 160, resizeMode: "cover" },
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
    marginTop: 6
  },
  plus: { width: 28, height: 28, marginBottom: 6 },
  photoText: { color: colors.textSecondary },
  submit: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 6
  },
  submitText: { fontWeight: "700", color: colors.textPrimary },
  error: { color: "#b91c1c", marginTop: 8 }
});
