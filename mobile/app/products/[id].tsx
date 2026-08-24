import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { api } from "../../lib/api";
import { useAsync } from "../../lib/use-async";
import { ProductForm } from "../../components/ProductForm";
import { Loading, Message } from "../../components/ui";

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, error, loading } = useAsync(async () => {
    const [product, collections] = await Promise.all([api.product(id), api.collections()]);
    return { product: product.product, collections: collections.collections };
  }, id);

  if (loading) return <Loading />;
  if (error || !data) {
    return (
      <View style={{ padding: 16 }}>
        <Message tone="error">{error ?? "Product not found"}</Message>
      </View>
    );
  }

  return <ProductForm product={data.product} collections={data.collections} />;
}
