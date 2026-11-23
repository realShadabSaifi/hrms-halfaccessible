import { describe, expect, it } from "vitest";
import {
  PUNCH_COOLDOWN_MS,
  cooldownRemainingMs,
  formatDuration,
  lastPunchAt,
  localDateKey,
  startOfDayIso,
  workedMs,
} from "./day";
import { MAX_ACCURACY_M, checkGeofence, distanceMeters, validateCoords, validateRadius } from "./geofence";

const office = { lat: 28.6139, lng: 77.209, radius_m: 150 };

describe("distanceMeters", () => {
  it("is zero for the same point and ~111 km per degree of latitude", () => {
    expect(distanceMeters(office, office)).toBe(0);
    const d = distanceMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });
});

describe("checkGeofence", () => {
  it("accepts a fix inside the circle", () => {
    const r = checkGeofence(office, { lat: 28.6145, lng: 77.209, accuracy: 20 });
    expect(r.ok).toBe(true);
  });

  it("rejects a fix outside the circle and reports the distance", () => {
    const r = checkGeofence(office, { lat: 28.62, lng: 77.209, accuracy: 20 });
    expect(r).toMatchObject({ ok: false, error: "outside" });
    expect(r.distance_m).toBeGreaterThan(600);
  });

  it("rejects an imprecise or malformed fix", () => {
    expect(checkGeofence(office, { ...office, accuracy: MAX_ACCURACY_M + 1 })).toMatchObject({
      error: "imprecise",
    });
    expect(checkGeofence(office, { lat: 91, lng: 0, accuracy: 5 })).toMatchObject({ error: "bad_location" });
    expect(checkGeofence(office, { lat: 0, lng: 0, accuracy: Number.NaN })).toMatchObject({
      error: "bad_location",
    });
  });
});

describe("validation", () => {
  it("checks coordinates and radius bounds", () => {
    expect(validateCoords(28.6, 77.2)).toBeNull();
    expect(validateCoords(-91, 0)).not.toBeNull();
    expect(validateCoords(0, 181)).not.toBeNull();
    expect(validateRadius(150)).toBeNull();
    expect(validateRadius(10)).not.toBeNull();
    expect(validateRadius(100.5)).not.toBeNull();
  });
});

describe("day helpers", () => {
  it("finds IST midnight", () => {
    // 2026-11-23 02:00 UTC is 07:30 IST on the 23rd → midnight IST is 18:30 UTC on the 22nd
    expect(startOfDayIso(new Date("2026-11-23T02:00:00Z"))).toBe("2026-11-22T18:30:00.000Z");
    // 2026-11-23 20:00 UTC is 01:30 IST on the 24th
    expect(startOfDayIso(new Date("2026-11-23T20:00:00Z"))).toBe("2026-11-23T18:30:00.000Z");
  });

  it("sums closed and open sessions, clipped to the day", () => {
    const now = new Date("2026-11-23T10:00:00Z");
    const ms = workedMs(
      [
        { punch_in_at: "2026-11-22T17:30:00Z", punch_out_at: "2026-11-22T19:30:00Z" }, // 1h after midnight IST
        { punch_in_at: "2026-11-23T08:00:00Z", punch_out_at: null }, // 2h open
      ],
      "2026-11-22T18:30:00Z",
      now,
    );
    expect(ms).toBe(3 * 3_600_000);
    expect(formatDuration(ms + 5 * 60_000)).toBe("3h 05m");
    expect(formatDuration(42 * 60_000)).toBe("42m");
  });
});

describe("punch cooldown", () => {
  it("blocks the next punch for a minute after the last one", () => {
    const at = "2026-11-23T10:00:00.000Z";
    expect(cooldownRemainingMs(null, new Date(at))).toBe(0);
    expect(cooldownRemainingMs(at, new Date("2026-11-23T10:00:15Z"))).toBe(45_000);
    expect(cooldownRemainingMs(at, new Date("2026-11-23T10:01:00Z"))).toBe(0);
    expect(cooldownRemainingMs(at, new Date("2026-11-23T10:05:00Z"))).toBe(0);
    expect(PUNCH_COOLDOWN_MS).toBe(60_000);
  });

  it("finds the latest punch event across sessions", () => {
    expect(lastPunchAt([])).toBeNull();
    expect(
      lastPunchAt([
        { punch_in_at: "2026-11-23T04:00:00Z", punch_out_at: "2026-11-23T08:00:00Z" },
        { punch_in_at: "2026-11-23T09:00:00Z", punch_out_at: null },
      ]),
    ).toBe("2026-11-23T09:00:00.000Z");
    expect(
      lastPunchAt([{ punch_in_at: "2026-11-23T04:00:00Z", punch_out_at: "2026-11-23T08:00:00Z" }]),
    ).toBe("2026-11-23T08:00:00.000Z");
  });

  it("groups instants by IST date", () => {
    expect(localDateKey("2026-11-23T19:00:00Z")).toBe("2026-11-24");
    expect(localDateKey("2026-11-23T10:00:00Z")).toBe("2026-11-23");
  });
});
