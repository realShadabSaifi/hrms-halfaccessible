import { describe, expect, it } from "vitest";
import {
  SIDEBAR_COLLAPSED_KEY,
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "./sidebarCollapsed";

function memoryStorage(start: Record<string, string> = {}) {
  const data = { ...start };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    data,
  };
}

describe("sidebar collapsed storage", () => {
  it("defaults to expanded when missing or invalid", () => {
    expect(readSidebarCollapsed(null)).toBe(false);
    expect(readSidebarCollapsed(memoryStorage())).toBe(false);
    expect(readSidebarCollapsed(memoryStorage({ [SIDEBAR_COLLAPSED_KEY]: "nope" }))).toBe(false);
  });

  it("reads and writes 1 and 0", () => {
    const storage = memoryStorage();
    writeSidebarCollapsed(storage, true);
    expect(storage.data[SIDEBAR_COLLAPSED_KEY]).toBe("1");
    expect(readSidebarCollapsed(storage)).toBe(true);
    writeSidebarCollapsed(storage, false);
    expect(storage.data[SIDEBAR_COLLAPSED_KEY]).toBe("0");
    expect(readSidebarCollapsed(storage)).toBe(false);
  });
});
