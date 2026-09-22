import { useState } from "react";
import { Link } from "expo-router";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import { theme } from "../../lib/theme";
import { ORDER_STATUSES, type OrderStatus } from "../../lib/types";
import { useAsync } from "../../lib/use-async";
import { Card, Chip, Loading, Message, StatusBadge, useBottomInset } from "../../components/ui";

export default function OrdersScreen() {
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const { data, error, loading, refreshing, refresh } = useAsync(() => api.orders(status), status ?? "all");

  const orders = data?.orders ?? [];
  const paddingBottom = useBottomInset();

  return (
    <View style={styles.flex}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <Chip label="Toutes" active={status === undefined} onPress={() => setStatus(undefined)} />
        {ORDER_STATUSES.map((value) => (
          <Chip key={value} label={value} active={status === value} onPress={() => setStatus(value)} />
        ))}
      </ScrollView>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order) => order.id}
          contentContainerStyle={[styles.list, { paddingBottom }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.ink} />
          }
          ListHeaderComponent={error ? <Message tone="error">{error}</Message> : null}
          ListEmptyComponent={
            error ? null : (
              <Card>
                <Text style={styles.empty}>No orders with that status.</Text>
              </Card>
            )
          }
          renderItem={({ item: order }) => (
            <Link href={`/orders/${order.id}`} asChild>
              <Pressable style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
                <Card style={styles.card}>
                  <View style={styles.rowTop}>
                    <Text style={styles.number}>{order.order_number}</Text>
                    <StatusBadge status={order.status} />
                  </View>

                  <Text style={styles.name}>{order.full_name}</Text>
                  <Text style={styles.meta}>{order.email}</Text>

                  <View style={styles.rowBottom}>
                    <Text style={styles.meta}>{formatDate(order.created_at)}</Text>
                    <Text style={styles.total}>{formatMoney(order.total_cents, order.currency)}</Text>
                  </View>
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
  filters: { paddingHorizontal: 16, paddingVertical: 12 },
  list: { padding: 16, paddingTop: 4 },
  card: { padding: 16, marginBottom: 12 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  number: { fontSize: 14, letterSpacing: 1, color: theme.ink },
  name: { marginTop: 12, fontSize: 16, color: theme.ink },
  meta: { marginTop: 4, fontSize: 12, color: theme.inkMuted },
  rowBottom: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  total: { fontSize: 15, color: theme.ink, fontVariant: ["tabular-nums"] },
  empty: { padding: 24, fontSize: 14, color: theme.inkSoft },
});
