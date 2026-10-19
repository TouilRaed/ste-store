import { Link, router } from "expo-router";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import { theme, type } from "../../lib/theme";
import { useAsync } from "../../lib/use-async";
import { Button, Loading, Message, Tag, useBottomInset } from "../../components/ui";

/**
 * The catalogue, as rows with their photo.
 *
 * "Nouvelle pièce" moves to a bar pinned at the bottom: it is the one thing
 * done from this screen, and at the top it sat where the thumb is not.
 */
export default function ProductsScreen() {
  const { data, error, loading, refreshing, refresh } = useAsync(() => api.products());
  const products = data?.products ?? [];
  const paddingBottom = useBottomInset(16);

  return (
    <View style={styles.flex}>
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(product) => product.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.blue} />
          }
          ListHeaderComponent={error ? <Message tone="error">{error}</Message> : null}
          ListEmptyComponent={
            error ? null : (
              <Text style={styles.empty}>
                Aucun produit. Ajoutez votre première pièce pour la mettre en vente.
              </Text>
            )
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item: product }) => (
            <Link href={`/products/${product.id}`} asChild>
              <Pressable style={({ pressed }) => [pressed && { backgroundColor: theme.blueWash }]}>
                <View style={styles.row}>
                <View style={styles.thumb}>
                  {product.images[0] ? (
                    <Image source={{ uri: product.images[0] }} style={styles.image} />
                  ) : null}
                </View>

                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    /{product.slug}
                  </Text>

                  {!product.is_active || product.is_featured ? (
                    <View style={styles.badges}>
                      {!product.is_active ? <Tag label="Masqué" /> : null}
                      {product.is_featured ? <Tag label="Mis en avant" tone="accent" /> : null}
                    </View>
                  ) : null}
                </View>

                <Text style={styles.price}>{formatMoney(product.price_cents, product.currency)}</Text>
                </View>
              </Pressable>
            </Link>
          )}
        />
      )}

      <View style={[styles.actionBar, { paddingBottom }]}>
        <Button label="Nouvelle pièce" onPress={() => router.push("/products/new")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.surface },
  list: { paddingBottom: 8 },
  separator: { height: 1, backgroundColor: theme.lineSoft, marginLeft: 78 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  thumb: {
    width: 50,
    height: 62,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: theme.canvas,
  },
  image: { width: "100%", height: "100%" },
  body: { flex: 1, paddingHorizontal: 12 },
  name: { ...type.bodyStrong, color: theme.ink },
  meta: { marginTop: 3, ...type.meta, color: theme.inkMuted },
  badges: { flexDirection: "row", gap: 6, marginTop: 6 },
  price: { ...type.bodyStrong, color: theme.ink, fontVariant: ["tabular-nums"] },
  empty: { padding: 24, ...type.body, color: theme.inkMuted, textAlign: "center" },
  actionBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    backgroundColor: theme.surface,
  },
});
