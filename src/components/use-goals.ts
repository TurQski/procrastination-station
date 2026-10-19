"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, RequestError } from "@/lib/api-client";
export type Remote<T> = { status: "loading" } | { status: "ready"; data: T } | { status: "auth" } | { status: "error"; message: string; code: number };
export function useGoals<T>(url: string, preserveReady = false) {
  const [state, setState] = useState<Remote<T>>({ status: "loading" });
  const version = useRef(0);
  const reload = useCallback(async () => {
    const request = ++version.current;
    setState(current => preserveReady && current.status === "ready" ? current : { status: "loading" });
    try { const data = await api<T>(url); if (request === version.current) setState({ status: "ready", data }); }
    catch (error) {
      if (request !== version.current) return;
      if (error instanceof RequestError && error.status === 401) setState({ status: "auth" });
      else setState({ status: "error", message: error instanceof Error ? error.message : "Couldn’t load your goals.", code: error instanceof RequestError ? error.status : 0 });
    }
  }, [url, preserveReady]);
  const cancel = useCallback(() => { version.current++; }, []);
  useEffect(() => {
    // Defer initial fetch so effects only synchronize with an external system.
    const timer = setTimeout(() => void reload(), 0);
    const focus = () => void reload();
    window.addEventListener("focus", focus);
    return () => { clearTimeout(timer); cancel(); window.removeEventListener("focus", focus); };
  }, [reload, cancel]);
  function expire() { version.current++; setState({ status: "auth" }); }
  return { state, reload, expire };
}
