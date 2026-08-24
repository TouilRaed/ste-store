import { View } from "react-native";
import { api } from "../../lib/api";
import { useAsync } from "../../lib/use-async";
import { ProductForm } from "../../components/ProductForm";
import { Loading, Message } from "../../components/ui";

export default function NewProductScreen() {
  const { data, error, loading } = useAsync(() => api.collections());

  if (loading) return <Loading />;
  if (error) {
    return (
      <View style={{ padding: 16 }}>
        <Message tone="error">{error}</Message>
      </View>
    );
  }

  return <ProductForm collections={data?.collections ?? []} />;
}
