import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, ApiError } from "../../lib/api";
import {
  formatDateTime,
  formatMoney,
  majorInputToMinor,
  minorToMajorInput,
  shippingFor,
} from "../../lib/format";
import { theme } from "../../lib/theme";
import {
  SETTABLE_ORDER_STATUSES,
  orderStatusLabel,
  type OrderItemInput,
  type OrderPatch,
  type OrderStatus,
  type Product,
} from "../../lib/types";
import { useAsync } from "../../lib/use-async";
import { Button, Card, Chip, Eyebrow, Field, Loading, Message, StatusBadge } from "../../components/ui";

/**
 * Price typed in dinars while the line stores minor units. Keeps its own draft
 * string so a half-typed "89," is not clobbered on the next render.
 */
function PriceField({
  valueMinor,
  currency,
  onChangeMinor,
}: {
  valueMinor: number;
  currency: string;
  onChangeMinor: (minor: number) => void;
}) {
  const [draft, setDraft] = useState(() => minorToMajorInput(valueMinor, currency));

  return (
    <Field
      label="Prix (DT)"
      value={draft}
      keyboardType="decimal-pad"
      onChangeText={(v) => {
        setDraft(v);
        const minor = majorInputToMinor(v, currency);
        if (minor !== null && !Number.isNaN(minor)) onChangeMinor(Math.max(0, minor));
      }}
    />
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, refreshing, refresh, setData } = useAsync(() => api.order(id), id);

  const [saving, setSaving] = useState<OrderStatus | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [edit, setEdit] = useState<OrderPatch | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(0);

  // Lines are edited locally, then saved as a whole set.
  const [lines, setLines] = useState<OrderItemInput[] | null>(null);
  const [savingLines, setSavingLines] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  // Only fetched once a piece is actually being added.
  const catalogue = useAsync(() => api.products(), picking ? "open" : "");

  const order = data?.order;
  // Bare digits with country code, e.g. "21653773703" — what tel:/wa.me expect,
  // not the "+216 XX XXX XXX" display form the order stores.
  const phoneDigits = (order?.phone ?? "").replace(/\D/g, "");

  /**
   * Hands the parcel to Intigo through the same admin endpoint the web uses.
   * City and délégation are whatever the customer chose at checkout: Intigo
   * rejects an unknown name, so re-typing them on a phone would only invite
   * a 400.
   */
  async function shipNow() {
    if (!order || !order.district) return;
    setShipping(true);
    setShipError(null);
    try {
      const res = await api.shipOrder(order.id, order.city, order.district);
      setData({ order: { ...order, ...res.order } });
    } catch (err) {
      setShipError(err instanceof ApiError ? err.message : "Impossible d'expédier");
    } finally {
      setShipping(false);
    }
  }

  async function changeStatus(status: OrderStatus) {
    if (!order || status === order.status) return;
    setSaving(status);
    setSaveError(null);
    try {
      const updated = await api.setOrderStatus(order.id, status);
      setData({ order: { ...order, ...updated.order } });
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Impossible de mettre à jour le statut");
    } finally {
      setSaving(null);
    }
  }

  // Lazily seeded from the loaded order so the inputs stay uncontrolled-free.
  const draft: OrderPatch =
    edit ??
    (order
      ? {
          full_name: order.full_name,
          email: order.email,
          phone: order.phone ?? "",
          address_line1: order.address_line1,
          address_line2: order.address_line2 ?? "",
          city: order.city,
          postal_code: order.postal_code,
          country: order.country,
          note: order.note ?? "",
          admin_note: order.admin_note ?? "",
        }
      : {});

  const setField = (key: keyof OrderPatch, value: string) =>
    setEdit({ ...draft, [key]: value });

  async function saveDetails() {
    if (!order) return;
    setSavingEdit(true);
    setSaveError(null);
    try {
      const patch: OrderPatch = {
        ...draft,
        phone: draft.phone?.trim() ? draft.phone : null,
        address_line2: draft.address_line2?.trim() ? draft.address_line2 : null,
        note: draft.note?.trim() ? draft.note : null,
        admin_note: draft.admin_note?.trim() ? draft.admin_note : null,
      };
      const updated = await api.updateOrder(order.id, patch);
      setData({ order: { ...order, ...updated.order } });
      setEdit(null);
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Impossible d'enregistrer ces informations");
    } finally {
      setSavingEdit(false);
    }
  }

  const currentLines: OrderItemInput[] =
    lines ??
    (order?.order_items ?? []).map((item) => ({
      product_slug: item.product_slug,
      product_name: item.product_name,
      image: item.image ?? null,
      size: item.size ?? null,
      color: item.color ?? null,
      unit_cents: item.unit_cents,
      quantity: item.quantity,
    }));

  const patchLine = (index: number, changes: Partial<OrderItemInput>) =>
    setLines(currentLines.map((line, i) => (i === index ? { ...line, ...changes } : line)));

  const dropLine = (index: number) => setLines(currentLines.filter((_, i) => i !== index));

  function addLine(product: Product) {
    setLines([
      ...currentLines,
      {
        product_slug: product.slug,
        product_name: product.name,
        image: product.images[0] ?? null,
        size: product.sizes[0] ?? null,
        color: product.colors[0] ?? null,
        unit_cents: product.price_cents,
        quantity: 1,
      },
    ]);
    setPicking(false);
  }

  async function saveLines() {
    if (!order) return;
    setSavingLines(true);
    setLinesError(null);
    try {
      const updated = await api.setOrderItems(order.id, currentLines);
      setData({ order: updated.order });
      setLines(null);
    } catch (err) {
      setLinesError(err instanceof ApiError ? err.message : "Impossible d'enregistrer ces lignes");
    } finally {
      setSavingLines(false);
    }
  }

  if (loading) return <Loading />;

  if (!order) {
    return (
      <View style={styles.container}>
        <Message tone="error">{error ?? "Commande introuvable"}</Message>
      </View>
    );
  }

  const draftSubtotal = currentLines.reduce((sum, line) => sum + line.unit_cents * line.quantity, 0);
  // Mirrors the server: only dinar orders re-derive delivery.
  const draftShipping = order.currency === "TND" ? shippingFor(draftSubtotal) : order.shipping_cents;
  const linesDirty = lines !== null;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.ink} />}
    >
      <Card style={styles.card}>
        <View style={styles.headRow}>
          <View>
            <Eyebrow>{formatDateTime(order.created_at)}</Eyebrow>
            <Text style={styles.number}>{order.order_number}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        <View style={styles.divider} />

        <Eyebrow>Livraison</Eyebrow>
        {order.tracking_code ? (
          <View>
            <Text style={styles.meta}>Expédiée · Intigo</Text>
            <Text style={styles.trackingCode}>{order.tracking_code}</Text>
          </View>
        ) : order.status === "cancelled" ? (
          <Text style={styles.meta}>Commande annulée.</Text>
        ) : !order.district ? (
          <Text style={styles.meta}>
            Délégation manquante — expédiez cette commande depuis le web.
          </Text>
        ) : (
          <View>
            <Text style={styles.meta}>
              {order.city} · {order.district}
            </Text>
            <Button
              label={shipping ? "Envoi à Intigo…" : "Créer le colis Intigo"}
              onPress={shipNow}
              disabled={shipping}
              style={styles.shipButton}
            />
          </View>
        )}
        {shipError ? <Message tone="error">{shipError}</Message> : null}

        <View style={styles.divider} />

        <Eyebrow>Statut</Eyebrow>
        <View style={styles.chips}>
          {SETTABLE_ORDER_STATUSES.map((status) => (
            <Chip
              key={status}
              label={saving === status ? "…" : orderStatusLabel(status)}
              active={order.status === status}
              onPress={() => changeStatus(status)}
            />
          ))}
        </View>
        {saveError ? <Message tone="error">{saveError}</Message> : null}
      </Card>

      <Card style={styles.card}>
        <Eyebrow>Pieces commandees</Eyebrow>
        <Text style={styles.lineHint}>
          Taille, couleur, quantite et prix. Le total se recalcule a l&apos;enregistrement.
        </Text>

        {currentLines.map((line, index) => (
          <View key={`${line.product_slug}-${index}`} style={styles.lineBlock}>
            <View style={styles.itemRow}>
              <View style={styles.thumb}>
                {line.image ? <Image source={{ uri: line.image }} style={styles.image} /> : null}
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemName}>{line.product_name}</Text>
                <Text style={styles.meta}>
                  {line.quantity} x {formatMoney(line.unit_cents, order.currency)}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatMoney(line.unit_cents * line.quantity, order.currency)}
              </Text>
            </View>

            <View style={styles.lineFields}>
              <View style={styles.lineHalf}>
                <Field
                  label="Taille"
                  value={line.size ?? ""}
                  onChangeText={(v) => patchLine(index, { size: v.trim() ? v : null })}
                />
              </View>
              <View style={styles.lineHalf}>
                <Field
                  label="Couleur"
                  value={line.color ?? ""}
                  onChangeText={(v) => patchLine(index, { color: v.trim() ? v : null })}
                />
              </View>
              <View style={styles.lineHalf}>
                <Field
                  label="Quantité"
                  value={String(line.quantity)}
                  keyboardType="number-pad"
                  onChangeText={(v) => patchLine(index, { quantity: Math.max(1, Number(v) || 1) })}
                />
              </View>
              <View style={styles.lineHalf}>
                <PriceField
                  valueMinor={line.unit_cents}
                  currency={order.currency}
                  onChangeMinor={(minor) => patchLine(index, { unit_cents: minor })}
                />
              </View>
            </View>

            <Button
              label="Retirer cette pièce"
              variant="danger"
              onPress={() => dropLine(index)}
              style={styles.lineRemove}
            />
          </View>
        ))}

        {picking ? (
          <View style={styles.pickerBlock}>
            <Eyebrow>Ajouter une piece</Eyebrow>
            {catalogue.loading ? (
              <Loading />
            ) : (
              <View style={styles.chips}>
                {(catalogue.data?.products ?? []).map((product) => (
                  <Chip
                    key={product.id}
                    label={`${product.name} - ${formatMoney(product.price_cents, product.currency)}`}
                    active={false}
                    onPress={() => addLine(product)}
                  />
                ))}
              </View>
            )}
            <Button
              label="Annuler"
              variant="outline"
              onPress={() => setPicking(false)}
              style={styles.button}
            />
          </View>
        ) : (
          <Button
            label="Ajouter une pièce"
            variant="outline"
            onPress={() => setPicking(true)}
            style={styles.button}
          />
        )}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.meta}>Sous-total</Text>
          <Text style={styles.totalValue}>{formatMoney(draftSubtotal, order.currency)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.meta}>Livraison</Text>
          <Text style={styles.totalValue}>{formatMoney(draftShipping, order.currency)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandRow]}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>
            {formatMoney(draftSubtotal + draftShipping, order.currency)}
          </Text>
        </View>

        {linesError ? <Message tone="error">{linesError}</Message> : null}

        {linesDirty ? (
          <Button
            label="Enregistrer les lignes"
            onPress={saveLines}
            loading={savingLines}
            style={styles.button}
          />
        ) : null}
      </Card>

      <Card style={styles.card}>
        <Eyebrow>Customer &amp; delivery</Eyebrow>

        <View style={styles.editBlock}>
          <Field label="Nom" value={draft.full_name ?? ""} onChangeText={(v) => setField("full_name", v)} />
          <Field
            label="Email"
            value={draft.email ?? ""}
            onChangeText={(v) => setField("email", v)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Téléphone"
            value={draft.phone ?? ""}
            onChangeText={(v) => setField("phone", v)}
            keyboardType="phone-pad"
          />
          <Field
            label="Adresse"
            value={draft.address_line1 ?? ""}
            onChangeText={(v) => setField("address_line1", v)}
          />
          <Field
            label="Appartement, étage"
            value={draft.address_line2 ?? ""}
            onChangeText={(v) => setField("address_line2", v)}
          />
          <Field label="Ville" value={draft.city ?? ""} onChangeText={(v) => setField("city", v)} />
          <Field
            label="Code postal"
            value={draft.postal_code ?? ""}
            onChangeText={(v) => setField("postal_code", v)}
          />
          <Field label="Pays" value={draft.country ?? ""} onChangeText={(v) => setField("country", v)} />
          <Field
            label="Note du client"
            value={draft.note ?? ""}
            onChangeText={(v) => setField("note", v)}
            multiline
          />
          <Field
            label="Note interne"
            value={draft.admin_note ?? ""}
            onChangeText={(v) => setField("admin_note", v)}
            multiline
            hint="Visible uniquement dans l'admin"
          />

          {saveError ? <Message tone="error">{saveError}</Message> : null}
          {savedAt > 0 && !edit ? <Message>Commande mise à jour.</Message> : null}

          <Button
            label="Enregistrer"
            onPress={saveDetails}
            loading={savingEdit}
            style={styles.button}
          />

          {/*
            Both use the customer's phone as stored — the same "+216 XX XXX XXX"
            form the confirmation call uses — stripped to digits for tel:/wa.me.
            Hidden rather than shown-disabled when there is no phone: nothing to
            call or message, so there is nothing useful the button could do.
          */}
          {phoneDigits ? (
            <>
              <Button
                label="Appeler le client"
                variant="outline"
                onPress={() => Linking.openURL(`tel:+${phoneDigits}`)}
                style={styles.button}
              />
              <Button
                label="WhatsApp"
                variant="outline"
                onPress={() => Linking.openURL(`https://wa.me/${phoneDigits}`)}
                style={styles.button}
              />
            </>
          ) : null}

          <Button
            label="Envoyer un e-mail au client"
            variant="outline"
            onPress={() => Linking.openURL(`mailto:${order.email}?subject=Commande ${order.order_number}`)}
            style={styles.button}
          />
        </View>
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  card: { padding: 20, marginBottom: 16 },
  headRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  number: { marginTop: 6, fontSize: 22, letterSpacing: 1, color: theme.ink },
  divider: { height: 1, backgroundColor: theme.line, marginVertical: 18 },
  trackingCode: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: theme.ink,
  },
  shipButton: { marginTop: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 14, rowGap: 8 },
  itemRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  thumb: { width: 48, height: 62, borderRadius: 10, overflow: "hidden", backgroundColor: theme.paperDeep },
  image: { width: "100%", height: "100%" },
  itemBody: { flex: 1, paddingHorizontal: 12 },
  itemName: { marginTop: 8, fontSize: 15, color: theme.ink },
  itemPrice: { fontSize: 14, color: theme.ink, fontVariant: ["tabular-nums"] },
  meta: { marginTop: 4, fontSize: 12, color: theme.inkMuted },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  totalValue: { fontSize: 14, color: theme.ink, fontVariant: ["tabular-nums"] },
  grandRow: { marginTop: 16, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 14 },
  grandLabel: { fontSize: 17, color: theme.ink },
  grandValue: { fontSize: 20, color: theme.ink, fontVariant: ["tabular-nums"] },
  address: { marginTop: 10, fontSize: 14, lineHeight: 21, color: theme.inkSoft },
  button: { marginTop: 12 },
  editBlock: { marginTop: 18 },
  lineBlock: { marginTop: 18, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 14 },
  lineFields: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  lineHalf: { flexBasis: "47%", flexGrow: 1 },
  lineRemove: { marginTop: 4 },
  pickerBlock: { marginTop: 18 },
  lineHint: { marginTop: 8, fontSize: 12, lineHeight: 18, color: theme.inkMuted },
});
