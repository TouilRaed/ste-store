import { useState } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, ApiError } from "../lib/api";
import { theme } from "../lib/theme";
import type { Collection, Product, ProductInput } from "../lib/types";
import { Button, Card, Chip, Eyebrow, Field, Message, Toggle } from "./ui";

type ProductFormProps = {
  product?: Product;
  collections: Collection[];
};

type Draft = {
  name: string;
  slug: string;
  description: string;
  details: string;
  images: string[];
  tags: string[];
  sizes: string;
  colors: string;
  price: string;
  compareAt: string;
  currency: string;
  stock: string;
  collectionId: string | null;
  gender: Product["gender"];
  isActive: boolean;
  isFeatured: boolean;
};

const GENDERS: Product["gender"][] = ["women", "men", "unisex"];

/** Same one-tap tags as the web admin. */
const TAG_PRESETS = [
  "Nouveau",
  "New drop",
  "Promotion",
  "Édition limitée",
  "Exclusif",
  "Dernières pièces",
  "Bientôt de retour",
];

function toDraft(product?: Product): Draft {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    details: product?.details.join("\n") ?? "",
    images: product?.images ?? [],
    tags: product?.tags ?? [],
    sizes: product?.sizes.join("\n") ?? "",
    colors: product?.colors.join("\n") ?? "",
    price: String(product?.price_cents ?? ""),
    compareAt: product?.compare_at_cents != null ? String(product.compare_at_cents) : "",
    currency: product?.currency ?? "USD",
    stock: String(product?.stock ?? "0"),
    collectionId: product?.collection_id ?? null,
    gender: product?.gender ?? "unisex",
    isActive: product?.is_active ?? true,
    isFeatured: product?.is_featured ?? false,
  };
}

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export function ProductForm({ product, collections }: ProductFormProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(product));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is needed to add images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    setError(null);
    try {
      const url = await api.uploadImage({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      });
      setDraft((prev) => ({ ...prev, images: [...prev.images, url] }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function buildPayload(): ProductInput | null {
    const price = Number(draft.price);
    const stock = Number(draft.stock);

    if (!draft.name.trim()) return withError("Name is required");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug.trim())) {
      return withError("Slug must be lowercase words separated by dashes");
    }
    if (!Number.isInteger(price) || price < 0) return withError("Price must be a whole number of cents");
    if (!Number.isInteger(stock) || stock < 0) return withError("Stock must be a whole number");

    return {
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      description: draft.description.trim(),
      details: splitLines(draft.details),
      images: draft.images,
      tags: draft.tags,
      sizes: splitLines(draft.sizes),
      colors: splitLines(draft.colors),
      price_cents: price,
      compare_at_cents: draft.compareAt.trim() ? Number(draft.compareAt) : null,
      currency: draft.currency.trim().toUpperCase() || "USD",
      stock,
      collection_id: draft.collectionId,
      gender: draft.gender,
      is_active: draft.isActive,
      is_featured: draft.isFeatured,
    };
  }

  function withError(message: string): null {
    setError(message);
    return null;
  }

  async function save() {
    setError(null);
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      if (product) await api.updateProduct(product.id, payload);
      else await api.createProduct(payload);
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this piece");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!product) return;
    Alert.alert("Delete this piece?", `${product.name} will be removed from the catalogue.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await api.deleteProduct(product.id);
            router.back();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Couldn't delete this piece");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        <Field label="Name" value={draft.name} onChangeText={(v) => set("name", v)} />
        <Field
          label="Slug"
          value={draft.slug}
          onChangeText={(v) => set("slug", v)}
          autoCapitalize="none"
          hint="Used in the URL: /product/your-slug"
        />
        <Field
          label="Description"
          value={draft.description}
          onChangeText={(v) => set("description", v)}
          multiline
        />
        <Field
          label="Specification"
          value={draft.details}
          onChangeText={(v) => set("details", v)}
          multiline
          hint="One line per bullet"
        />
        <Eyebrow>Photos</Eyebrow>
        <View style={styles.photoRow}>
          {draft.images.map((url, index) => (
            <View key={url} style={styles.photo}>
              <Image source={{ uri: url }} style={styles.photoImage} />
              {index === 0 ? (
                <View style={styles.coverTag}>
                  <Text style={styles.coverText}>Cover</Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => set("images", draft.images.filter((u) => u !== url))}
                style={styles.photoRemove}
                accessibilityLabel="Remove photo"
              >
                <Text style={styles.photoRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}

          <Pressable onPress={pickImage} style={styles.photoAdd} disabled={uploading}>
            {uploading ? <ActivityIndicator color={theme.ink} /> : <Text style={styles.photoAddText}>+</Text>}
          </Pressable>
        </View>
        <Text style={styles.photoHint}>First photo is the card image. Up to 5 MB each.</Text>

        <View style={styles.tagBlock}>
          <Eyebrow>Étiquettes</Eyebrow>
          <View style={styles.chips}>
            {TAG_PRESETS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                active={draft.tags.includes(tag)}
                onPress={() =>
                  set(
                    "tags",
                    draft.tags.includes(tag)
                      ? draft.tags.filter((t) => t !== tag)
                      : [...draft.tags, tag],
                  )
                }
              />
            ))}
          </View>
          <Text style={styles.photoHint}>
            Épuisé, « Plus que N » et la promo sont automatiques — inutile de les cocher.
          </Text>
        </View>
        <Field label="Sizes" value={draft.sizes} onChangeText={(v) => set("sizes", v)} multiline hint="One per line" />
        <Field
          label="Colours"
          value={draft.colors}
          onChangeText={(v) => set("colors", v)}
          multiline
          hint="One per line"
        />
      </Card>

      <Card style={styles.card}>
        <Field
          label="Prix (millimes)"
          value={draft.price}
          onChangeText={(v) => set("price", v)}
          keyboardType="number-pad"
        />
        <Field
          label="Prix barré (millimes)"
          value={draft.compareAt}
          onChangeText={(v) => set("compareAt", v)}
          keyboardType="number-pad"
          hint="1 DT = 1000 millimes. Ex : 220 DT = 220000"
        />
        <Field
          label="Currency"
          value={draft.currency}
          onChangeText={(v) => set("currency", v)}
          autoCapitalize="characters"
          maxLength={3}
        />
        <Field
          label="Stock"
          value={draft.stock}
          onChangeText={(v) => set("stock", v)}
          keyboardType="number-pad"
        />

        <Eyebrow>Collection</Eyebrow>
        <View style={styles.chips}>
          <Chip label="None" active={draft.collectionId === null} onPress={() => set("collectionId", null)} />
          {collections.map((collection) => (
            <Chip
              key={collection.id}
              label={collection.name}
              active={draft.collectionId === collection.id}
              onPress={() => set("collectionId", collection.id)}
            />
          ))}
        </View>

        <View style={styles.spacer} />

        <Eyebrow>Cut for</Eyebrow>
        <View style={styles.chips}>
          {GENDERS.map((gender) => (
            <Chip
              key={gender}
              label={gender}
              active={draft.gender === gender}
              onPress={() => set("gender", gender)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <Toggle label="Visible in the shop" value={draft.isActive} onChange={(v) => set("isActive", v)} />
        <Toggle
          label="Featured on the home page"
          value={draft.isFeatured}
          onChange={(v) => set("isFeatured", v)}
        />
      </Card>

      {error ? <Message tone="error">{error}</Message> : null}

      <Button
        label={product ? "Save changes" : "Create piece"}
        onPress={save}
        loading={saving}
        style={styles.save}
      />

      {product ? (
        <>
          <Text style={styles.deleteHint}>
            Past orders keep their own copy of the name and price, so deleting is safe.
          </Text>
          <Button
            label="Delete this piece"
            variant="danger"
            onPress={confirmDelete}
            loading={deleting}
            style={styles.delete}
          />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  card: { padding: 20, marginBottom: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, rowGap: 8 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  photo: { width: 78, height: 104, borderRadius: 14, overflow: "hidden", backgroundColor: theme.paperDeep },
  photoImage: { width: "100%", height: "100%" },
  coverTag: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverText: { fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: theme.ink },
  photoRemove: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { fontSize: 15, lineHeight: 17, color: theme.accentDeep },
  photoAdd: {
    width: 78,
    height: 104,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddText: { fontSize: 24, color: theme.inkMuted },
  photoHint: { marginTop: 8, fontSize: 11, color: theme.inkMuted },
  spacer: { height: 18 },
  tagBlock: { marginTop: 22 },
  divider: { height: 1, backgroundColor: theme.line, marginVertical: 18 },
  save: { marginTop: 8 },
  deleteHint: { marginTop: 28, fontSize: 12, lineHeight: 18, color: theme.inkMuted, textAlign: "center" },
  delete: { marginTop: 12 },
});
