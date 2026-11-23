export const RADIUS_MIN_M = 20;
export const RADIUS_MAX_M = 5000;
/** A GPS fix vaguer than this can't say whether someone is inside the circle. */
export const MAX_ACCURACY_M = 200;

export type OfficeCircle = { lat: number; lng: number; radius_m: number };
export type Fix = { lat: number; lng: number; accuracy: number };

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function validateCoords(lat: number, lng: number): string | null {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return "latitude must be between -90 and 90";
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return "longitude must be between -180 and 180";
  return null;
}

export function validateRadius(radius: number): string | null {
  if (!Number.isInteger(radius)) return "radius must be a whole number of metres";
  if (radius < RADIUS_MIN_M || radius > RADIUS_MAX_M) {
    return `radius must be ${RADIUS_MIN_M}–${RADIUS_MAX_M} m`;
  }
  return null;
}

export type GeofenceResult =
  | { ok: true; distance_m: number }
  | { ok: false; error: "bad_location" | "imprecise" | "outside"; distance_m?: number };

export function checkGeofence(office: OfficeCircle, fix: Fix): GeofenceResult {
  if (validateCoords(fix.lat, fix.lng) || !Number.isFinite(fix.accuracy) || fix.accuracy < 0) {
    return { ok: false, error: "bad_location" };
  }
  if (fix.accuracy > MAX_ACCURACY_M) return { ok: false, error: "imprecise" };
  const distance_m = Math.round(distanceMeters(office, fix));
  if (distance_m > office.radius_m) return { ok: false, error: "outside", distance_m };
  return { ok: true, distance_m };
}
