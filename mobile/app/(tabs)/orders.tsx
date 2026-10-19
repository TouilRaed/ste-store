import { useState } from "react";
import { Link } from "expo-router";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import { theme, type } from "../../lib/theme";
import { ORDER_STATUSES, orderStatusLabel, type OrderStatus } from "../../lib/types";
import { useAsync } from "../../lib/use-async";
import { Chip, Loading, Message, StatusBadge, useBottomInset } from "../../components/ui";

/**
 * The order list is the screen this app exists for, so it is a list: one
 * hairline-separated row per order, scannable down the left for who and down
 * the right for how much.
 *
 * Each order used to be its own floating card with four lines and a divider
 * inside it, which fit three orders on a screen and made a busy day look like
 * a long scroll.
 */
export default function OrdersScreen() {
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const { data, error, loading, refreshing, refresh } = useAsync(() => api.orders(status), status ?? "all");

  const orders = data?.orders ?? [];
  const paddingBottom = useBottomInset();

  return (
    <View style={styles.flex}>
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Chip label="Toutes" active={status === undefined} onPress={() => setStatus(undefined)} />
          {ORDER_STATUSES.map((value) => (
            <Chip
              key={value}
              label={orderStatusLabel(value)}
              active={status === value}
              onPress={() => setStatus(value)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order) => order.id}
          contentContainerStyle={[styles.list, { paddingBottom }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.blue} />
          }
          ListHeaderComponent={error ? <Message tone="error">{error}</Message> : null}
          ListEmptyComponent={
            error ? null : (
              <Text style={styles.empty}>
                {status ? "Aucune commande avec ce statut." : "Aucune commande pour l'instant."}
              </Text>
            )
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item: order }) => (
            <Link href={`/orders/${order.id}`} asChild>
              <Pressable style={({ pressed }) => [pressed && { backgroundColor: theme.blueWash }]}>
                <View style={styles.row}>
                <View style={styles.main}>
                  <Text style={styles.number}>{order.order_number}</Text>
                  <Text style={styles.name} numberOfLines={1}>
                    {order.full_name}
                    {order.city ? ` · ${order.city}` : ""}
                  </Text>
                  <View style={styles.statusLine}>
                    <StatusBadge status={order.status} />
                    <Text style={styles.date}>{formatDate(order.created_at)}</Text>
                  </View>
                </View>
                <Text style={styles.total}>{formatMoney(order.total_cents, order.currency)}</Text>
                </View>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.surface },
  filterBar: { backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.line },
  filters: { paddingHorizontal: 16, paddingVertical: 10 },
  list: { paddingTop: 0 },
  separator: { height: 1, backgroundColor: theme.lineSoft, marginLeft: 16 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  main: { flex: 1, minWidth: 0 },
  number: { ...type.mono, color: theme.ink },
  name: { marginTop: 3, ...type.body, color: theme.inkSoft },
  statusLine: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 10 },
  date: { ...type.meta, color: theme.inkMuted },
  total: { ...type.bodyStrong, color: theme.ink, fontVariant: ["tabular-nums"], flexShrink: 0 },
  empty: { padding: 24, ...type.body, color: theme.inkMuted, textAlign: "center" },
});
