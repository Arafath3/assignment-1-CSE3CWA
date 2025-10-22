"use client";

import * as React from "react";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function safeParse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function loadJSON<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  return safeParse<T>(localStorage.getItem(key));
}

export function saveJSON<T extends Json>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function useDebouncedCallback<T extends Json>(key: string, delay = 250) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  return React.useCallback(
    (value: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => saveJSON(key, value), delay);
    },
    [key, delay]
  );
}

export function usePersistentState<T extends Json>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() => {
    const loaded = loadJSON<T>(key);
    return loaded !== undefined ? loaded : initial;
  });

  const save = useDebouncedCallback<T>(key);

  React.useEffect(() => {
    save(state);
  }, [state, save]);

  return [state, setState];
}
