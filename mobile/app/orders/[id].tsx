import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  Image,
  KeyboardAvoidingView,
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
import { telUrl, whatsappUrl } from "../../lib/phone";
import { theme, type } from "../../lib/theme";
import {
  SETTABLE_ORDER_STATUSES,
  orderStatusLabel,
  type OrderItemInput,
  type OrderPatch,
  type OrderStatus,
  type Product,
} from "../../lib/types";
import { useAsync } from "../../lib/use-async";
import {
  Button,
  Card,
  Chip,
  Label,
  SectionTitle,
  Field,
  Loading,
  Message,
  StatusBadge,
  useBottomInset,
} from "../../components/ui";

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

  const paddingBottom = useBottomInset();
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

  // Stripping punctuation is not enough on its own: an order that stored the
  // bare local "53773703" would have dialled tel:+53773703. `lib/phone` puts
  // the country code back, the same way the web admin does.
  const callUrl = telUrl(order?.phone);
  const firstName = (order?.full_name ?? "").trim().split(/\s+/)[0] ?? "";
  const chatUrl = whatsappUrl(
    order?.phone,
    `${firstName ? `Bonjour ${firstName}, ` : "Bonjour, "}nous vous contactons au sujet de votre commande ${order?.order_number ?? ""} chez Sté DM.`,
  );

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
      // Carried through untouched: the editor replaces every line on save, so
      // dropping these would erase what the customer chose.
      options: item.options ?? [],
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
        // A piece added by the shop has no customer choice behind it; the
        // first choice of each group is the sensible default.
        options: (product.option_groups ?? [])
          .filter((g) => g.choices.length > 0)
          .map((g) => ({ label: g.label, value: g.choices[0].name })),
        size: null,
        color: null,
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.ink} />}
      >
        <Card style={styles.card}>
          <View style={styles.headRow}>
            <View>
              <Label>{formatDateTime(order.created_at)}</Label>
              <Text style={styles.number}>{order.order_number}</Text>
            </View>
            <StatusBadge status={order.status} />
          </View>

          {/* A cash-on-delivery order is confirmed by phone before the parcel
              moves, so reaching the customer comes first. Hidden rather than
              shown disabled when the order carries no number: there would be
              nothing for the button to do. */}
          {callUrl || chatUrl ? (
            <View style={styles.contactRow}>
              {callUrl ? (
                <Button
                  label="Appeler"
                  onPress={() => Linking.openURL(callUrl)}
                  style={styles.contactButton}
                />
              ) : null}
              {chatUrl ? (
                <Button
                  label="WhatsApp"
                  variant="outline"
                  onPress={() => Linking.openURL(chatUrl)}
                  style={styles.contactButton}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.divider} />

          <Label>Livraison</Label>
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

          <Label>Statut</Label>
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
          <SectionTitle>Pièces commandées</SectionTitle>
          <Text style={styles.lineHint}>
            Quantité et prix. Le total se recalcule à l&apos;enregistrement.
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
                  {line.options && line.options.length > 0 ? (
                    <Text style={styles.meta}>
                      {line.options.map((o) => `${o.label} : ${o.value}`).join(" · ")}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.itemPrice}>
                  {formatMoney(line.unit_cents * line.quantity, order.currency)}
                </Text>
              </View>

              <View style={styles.lineFields}>
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
              <Label>Ajouter une pièce</Label>
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
          <Label>Customer &amp; delivery</Label>

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

            {/* Cash-on-delivery orders carry no email at all, and a mailto:
                built from a missing one opens the mail app addressed to
                "null". Hidden on the same grounds as the phone buttons. */}
            {order.email ? (
              <Button
                label="Envoyer un e-mail au client"
                variant="outline"
                onPress={() => Linking.openURL(`mailto:${order.email}?subject=Commande ${order.order_number}`)}
                style={styles.button}
              />
            ) : null}
          </View>
        </Card>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16 },
  // Sections, not floating cards: a hairline box on white, so the eye runs
  // down the order rather than hopping between shadows.
  card: {
    padding: 18,
    marginBottom: 14,
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
  },
  headRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  number: { marginTop: 4, fontSize: 24, fontWeight: "700", color: theme.ink, fontVariant: ["tabular-nums"] },
  divider: { height: 1, backgroundColor: theme.lineSoft, marginVertical: 16 },
  trackingCode: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: theme.ink,
  },
  shipButton: { marginTop: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, rowGap: 8 },
  itemRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  thumb: { width: 46, height: 58, borderRadius: 10, overflow: "hidden", backgroundColor: theme.canvas },
  image: { width: "100%", height: "100%" },
  itemBody: { flex: 1, paddingHorizontal: 12 },
  itemName: { ...type.bodyStrong, color: theme.ink },
  itemPrice: { ...type.body, color: theme.ink, fontVariant: ["tabular-nums"] },
  meta: { marginTop: 3, ...type.meta, color: theme.inkMuted },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  totalValue: { ...type.body, color: theme.inkSoft, fontVariant: ["tabular-nums"] },
  grandRow: { marginTop: 14, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 14 },
  grandLabel: { ...type.sectionTitle, color: theme.ink },
  grandValue: { fontSize: 22, fontWeight: "700", color: theme.ink, fontVariant: ["tabular-nums"] },
  address: { marginTop: 8, ...type.body, lineHeight: 22, color: theme.inkSoft },
  button: { marginTop: 12 },
  contactRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  contactButton: { flex: 1, paddingHorizontal: 12 },
  editBlock: { marginTop: 16 },
  lineBlock: { marginTop: 16, borderTopWidth: 1, borderTopColor: theme.lineSoft, paddingTop: 14 },
  lineFields: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  lineHalf: { flexBasis: "47%", flexGrow: 1 },
  lineRemove: { marginTop: 4 },
  pickerBlock: { marginTop: 16 },
  lineHint: { marginTop: 8, ...type.meta, lineHeight: 19, color: theme.inkMuted },
});
