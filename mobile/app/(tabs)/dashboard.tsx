import { Link } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import { theme } from "../../lib/theme";
import { useAsync } from "../../lib/use-async";
import { Card, Eyebrow, Loading, Message, StatusBadge } from "../../components/ui";

export default function DashboardScreen() {
  const { data, error, loading, refreshing, refresh } = useAsync(() => api.stats());

  if (loading) return <Loading />;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.ink} />}
    >
      {error ? <Message tone="error">{error}</Message> : null}

      {data ? (
        <>
          <View style={styles.grid}>
            {[
              { label: "Chiffre d'affaires", value: formatMoney(data.revenueCents, data.currency), hint: "excl. cancelled" },
              { label: "Commandes", value: String(data.orders.total), hint: `${data.orders.pending} pending` },
              { label: "Produits", value: String(data.products.total), hint: `${data.products.active} active` },
              { label: "Stock faible", value: String(data.products.lowStock), hint: "8 or fewer" },
            ].map((tile) => (
              <Card key={tile.label} style={styles.tile}>
                <Eyebrow>{tile.label}</Eyebrow>
                <Text style={styles.tileValue}>{tile.value}</Text>
                <Text style={styles.tileHint}>{tile.hint}</Text>
              </Card>
            ))}
          </View>

          <View style={styles.sectionHead}>
            <Eyebrow>Latest orders</Eyebrow>
          </View>

          <Card>
            {data.recentOrders.length === 0 ? (
              <Text style={styles.empty}>No orders yet.</Text>
            ) : (
              data.recentOrders.map((order, index) => (
                <Link key={order.id} href={`/orders/${order.id}`} asChild>
                  <Pressable
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 && styles.rowDivider,
                      pressed && { backgroundColor: theme.paperDeep },
                    ]}
                  >
                    <View style={styles.rowMain}>
                      <Text style={styles.rowNumber}>{order.order_number}</Text>
                      <Text style={styles.rowMeta}>
                        {order.full_name} · {formatDate(order.created_at)}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <StatusBadge status={order.status} />
                      <Text style={styles.rowTotal}>
                        {formatMoney(order.total_cents, order.currency)}
                      </Text>
                    </View>
                  </Pressable>
                </Link>
              ))
            )}
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  tile: { width: "50%", flexGrow: 1, flexBasis: "45%", margin: 6, padding: 18 },
  tileValue: { marginTop: 12, fontSize: 26, color: theme.ink, fontVariant: ["tabular-nums"] },
  tileHint: { marginTop: 4, fontSize: 11, color: theme.inkMuted },
  sectionHead: { marginTop: 28, marginBottom: 12, paddingHorizontal: 6 },
  row: { flexDirection: "row", alignItems: "center", padding: 16 },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.line },
  rowMain: { flex: 1, paddingRight: 12 },
  rowNumber: { fontSize: 14, letterSpacing: 1, color: theme.ink },
  rowMeta: { marginTop: 4, fontSize: 12, color: theme.inkMuted },
  rowRight: { alignItems: "flex-end" },
  rowTotal: { marginTop: 6, fontSize: 14, color: theme.ink, fontVariant: ["tabular-nums"] },
  empty: { padding: 24, fontSize: 14, color: theme.inkSoft },
});
