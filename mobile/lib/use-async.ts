import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./api";

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
};

/**
 * Small data hook: loads on mount and whenever `key` changes, exposes a
 * pull-to-refresh handler and a plain error string for the UI.
 *
 * The fetcher lives in a ref so callers can pass an inline closure without
 * re-triggering the load — `key` alone decides when to re-run.
 */
export function useAsync<T>(fetcher: () => Promise<T>, key: string = "") {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: true,
    refreshing: false,
  });

  const run = useCallback(async (mode: "load" | "refresh") => {
    setState((prev) => ({
      ...prev,
      error: null,
      loading: mode === "load",
      refreshing: mode === "refresh",
    }));
    try {
      const data = await fetcherRef.current();
      setState({ data, error: null, loading: false, refreshing: false });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong";
      setState((prev) => ({ ...prev, error: message, loading: false, refreshing: false }));
    }
  }, []);

  useEffect(() => {
    void run("load");
  }, [run, key]);

  return {
    ...state,
    reload: () => run("load"),
    refresh: () => run("refresh"),
    setData: (data: T) => setState((prev) => ({ ...prev, data })),
  };
}
