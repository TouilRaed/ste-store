import { Link } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import { theme, type } from "../../lib/theme";
import { useAsync } from "../../lib/use-async";
import { Loading, Message, SectionTitle, StatusBadge, useBottomInset } from "../../components/ui";

/**
 * What the shop owner wants on opening the app, in that order: how much has
 * been sold, what needs doing, and what just came in.
 *
 * The revenue figure gets the brand colour and the whole width; the four
 * equal tiles it used to share that space with made the number compete with
 * "Stock faible" for attention.
 */
export default function DashboardScreen() {
  const { data, error, loading, refreshing, refresh } = useAsync(() => api.stats());
  const paddingBottom = useBottomInset();

  if (loading) return <Loading />;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.blue} />}
    >
      {error ? <Message tone="error">{error}</Message> : null}

      {data ? (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Chiffre d&apos;affaires</Text>
            <Text style={styles.heroValue}>{formatMoney(data.revenueCents, data.currency)}</Text>
            <Text style={styles.heroHint}>Commandes annulées non comptées</Text>
          </View>

          <View style={styles.stats}>
            {[
              { value: String(data.orders.pending), label: "en attente", strong: data.orders.pending > 0 },
              { value: String(data.orders.total), label: "commandes", strong: false },
              { value: String(data.products.active), label: "en vente", strong: false },
              { value: String(data.orders.shipped), label: "expédiées", strong: false },
            ].map((stat) => (
              <View key={stat.label} style={styles.stat}>
                <Text style={[styles.statValue, stat.strong && { color: theme.blue }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionHead}>
            <SectionTitle>Dernières commandes</SectionTitle>
          </View>

          <View style={styles.list}>
            {data.recentOrders.length === 0 ? (
              <Text style={styles.empty}>Aucune commande pour l&apos;instant.</Text>
            ) : (
              data.recentOrders.map((order, index) => (
                <Link key={order.id} href={`/orders/${order.id}`} asChild>
                  <Pressable
                    style={({ pressed }) => [
                      index > 0 && styles.rowDivider,
                      pressed && { backgroundColor: theme.blueWash },
                    ]}
                  >
                    <View style={styles.row}>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowNumber}>{order.order_number}</Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {order.full_name} · {formatDate(order.created_at)}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.rowTotal}>
                        {formatMoney(order.total_cents, order.currency)}
                      </Text>
                      <StatusBadge status={order.status} />
                    </View>
                    </View>
                  </Pressable>
                </Link>
              ))
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  hero: {
    backgroundColor: theme.blue,
    borderRadius: 16,
    padding: 20,
  },
  heroLabel: { ...type.meta, color: "rgba(255,255,255,0.8)" },
  heroValue: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: "700",
    color: theme.white,
    fontVariant: ["tabular-nums"],
  },
  heroHint: { marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.7)" },
  stats: {
    flexDirection: "row",
    marginTop: 12,
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "600", color: theme.ink, fontVariant: ["tabular-nums"] },
  statLabel: { marginTop: 2, fontSize: 12, color: theme.inkMuted },
  list: {
    marginTop: 10,
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    overflow: "hidden",
  },
  sectionHead: { marginTop: 22, marginBottom: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.lineSoft },
  rowMain: { flex: 1, minWidth: 0 },
  rowNumber: { ...type.mono, color: theme.ink },
  rowMeta: { marginTop: 3, ...type.meta, color: theme.inkMuted },
  rowRight: { alignItems: "flex-end", gap: 3, flexShrink: 0 },
  rowTotal: { ...type.bodyStrong, color: theme.ink, fontVariant: ["tabular-nums"] },
  empty: { padding: 20, ...type.body, color: theme.inkMuted },
});
