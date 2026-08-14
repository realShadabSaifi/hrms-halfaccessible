"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

const HeaderActionsContext = createContext<{
  node: ReactNode;
  setNode: (node: ReactNode) => void;
} | null>(null);

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<ReactNode>(null);
  const value = useMemo(() => ({ node, setNode }), [node]);
  return <HeaderActionsContext.Provider value={value}>{children}</HeaderActionsContext.Provider>;
}

export function HeaderActions({ children }: { children: ReactNode }) {
  const setNode = useContext(HeaderActionsContext)?.setNode;
  useLayoutEffect(() => {
    if (!setNode) return;
    setNode(children);
    return () => setNode(null);
  }, [children, setNode]);
  return null;
}

export function HeaderActionsSlot() {
  return useContext(HeaderActionsContext)?.node ?? null;
}
