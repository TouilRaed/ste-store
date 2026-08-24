import { Redirect } from "expo-router";
import { useAuthToken } from "../lib/auth";
import { Loading } from "../components/ui";

/** Sends signed-in admins straight to the dashboard, everyone else to login. */
export default function Index() {
  const { token, ready } = useAuthToken();

  if (!ready) return <Loading />;
  return <Redirect href={token ? "/(tabs)/dashboard" : "/login"} />;
}
