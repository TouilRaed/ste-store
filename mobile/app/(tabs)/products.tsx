import { Link, router } from "expo-router";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import { theme } from "../../lib/theme";
import { useAsync } from "../../lib/use-async";
import { Button, Card, Loading, Message, Tag } from "../../components/ui";

export default function ProductsScreen() {
  const { data, error, loading, refreshing, refresh } = useAsync(() => api.products());
  const products = data?.products ?? [];

  return (
    <View style={styles.flex}>
      <View style={styles.head}>
        <Button label="New piece" onPress={() => router.push("/products/new")} />
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(product) => product.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.ink} />
          }
          ListHeaderComponent={error ? <Message tone="error">{error}</Message> : null}
          ListEmptyComponent={
            error ? null : (
              <Card>
                <Text style={styles.empty}>No products yet.</Text>
              </Card>
            )
          }
          renderItem={({ item: product }) => (
            <Link href={`/products/${product.id}`} asChild>
              <Pressable style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
                <Card style={styles.card}>
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
                      {product.gender} · {product.stock} in stock
                    </Text>

                    <View style={styles.badges}>
                      {!product.is_active ? <Tag label="Hidden" /> : null}
                      {product.is_featured ? <Tag label="Featured" tone="accent" /> : null}
                    </View>
                  </View>

                  <Text style={styles.price}>{formatMoney(product.price_cents, product.currency)}</Text>
                </Card>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 4, paddingBottom: 40 },
  card: { flexDirection: "row", alignItems: "center", padding: 12, marginBottom: 12 },
  thumb: {
    width: 52,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.paperDeep,
  },
  image: { width: "100%", height: "100%" },
  body: { flex: 1, paddingHorizontal: 14 },
  name: { fontSize: 16, color: theme.ink },
  meta: { marginTop: 4, fontSize: 12, color: theme.inkMuted, textTransform: "capitalize" },
  badges: { flexDirection: "row", gap: 6, marginTop: 8 },
  price: { fontSize: 15, color: theme.ink, fontVariant: ["tabular-nums"] },
  empty: { padding: 24, fontSize: 14, color: theme.inkSoft },
});
