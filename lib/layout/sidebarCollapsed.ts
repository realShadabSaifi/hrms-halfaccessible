export const SIDEBAR_COLLAPSED_KEY = "ha-sidebar-collapsed";

export function readSidebarCollapsed(storage: Pick<Storage, "getItem"> | null): boolean {
  if (!storage) return false;
  return storage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
}

export function writeSidebarCollapsed(storage: Pick<Storage, "setItem">, collapsed: boolean): void {
  storage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
}
