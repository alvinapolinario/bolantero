import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

export function VerifyScreen({ onBack }: { onBack: () => void }) {
  const [idType, setIdType] = useState("PhilSys ID");
  const [idNumber, setIdNumber] = useState("");
  const [idPath, setIdPath] = useState<string | null>(null);
  const [selfiePath, setSelfiePath] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function pickAndUpload(bucket: "ids" | "selfies") {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Sign in required.");
      return;
    }
    const ext = asset.uri.split(".").pop() ?? "jpg";
    const path = `${user.id}/${bucket}-${Date.now()}.${ext}`;
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: true,
      contentType: asset.mimeType ?? "image/jpeg",
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    if (bucket === "ids") setIdPath(path);
    else setSelfiePath(path);
  }

  async function submit() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("verification_submissions").insert({
      user_id: user.id,
      target_level: 2,
      id_type: idType,
      id_number: idNumber,
      id_image_path: idPath,
      selfie_path: selfiePath,
      status: "pending",
    });
    setMessage(error ? error.message : "Submitted for Bolantero Verified review.");
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Identity verification</Text>
      <Text style={styles.sub}>
        Level 2 required before placing orders. Admin reviews ID + selfie.
      </Text>

      <Text style={styles.label}>ID type</Text>
      <TextInput style={styles.input} value={idType} onChangeText={setIdType} />
      <Text style={styles.label}>ID number</Text>
      <TextInput style={styles.input} value={idNumber} onChangeText={setIdNumber} />

      <Pressable style={styles.btnSecondary} onPress={() => pickAndUpload("ids")}>
        <Text style={styles.btnSecondaryText}>
          {idPath ? "ID uploaded" : "Upload government ID"}
        </Text>
      </Pressable>
      <Pressable style={styles.btnSecondary} onPress={() => pickAndUpload("selfies")}>
        <Text style={styles.btnSecondaryText}>
          {selfiePath ? "Selfie uploaded" : "Upload live selfie"}
        </Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Submit for review</Text>
      </Pressable>
      {message ? <Text style={styles.sub}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 16 },
  link: { color: theme.colors.brand, fontWeight: "800", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: theme.colors.brandDeep },
  sub: { color: theme.colors.muted, marginVertical: 8 },
  label: { fontWeight: "700", color: theme.colors.muted, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginTop: 6,
  },
  btn: {
    marginTop: 16,
    backgroundColor: theme.colors.brand,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
  btnSecondary: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    backgroundColor: theme.colors.bgElevated,
  },
  btnSecondaryText: { fontWeight: "800", color: theme.colors.brandDeep },
});
