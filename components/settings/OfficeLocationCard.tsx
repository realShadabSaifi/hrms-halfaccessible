"use client";

import { useState } from "react";
import { updateOfficeLocation } from "@/app/(portal)/settings/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { RADIUS_MAX_M, RADIUS_MIN_M } from "@/lib/attendance/geofence";
import type { OfficeLocation } from "@/lib/attendance/office";

export function OfficeLocationCard({
  office,
  onToast,
}: {
  office: OfficeLocation | null;
  onToast: (msg: string) => void;
}) {
  const [lat, setLat] = useState(office ? String(office.lat) : "");
  const [lng, setLng] = useState(office ? String(office.lng) : "");
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) {
      onToast("this browser can't share location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
        onToast(`got it, accurate to about ${Math.round(pos.coords.accuracy)} m.`);
      },
      (err) => {
        setLocating(false);
        onToast(err.code === err.PERMISSION_DENIED ? "location permission denied." : "couldn't get location.");
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  const mapHref =
    lat && lng ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}` : null;

  return (
    <div className="mt-6 rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
      <div className="font-[family-name:var(--font-display)] text-base font-bold">office location</div>
      <p className="mb-3.5 text-xs text-ha-muted">
        people can only punch in and out from inside this circle.
      </p>
      <form
        action={async (fd) => {
          const r = await updateOfficeLocation(fd);
          onToast(r.ok ? "office location saved." : r.error ?? "nope");
        }}
        className="grid gap-3"
      >
        <TextField name="label" label="name" defaultValue={office?.label ?? "office"} maxLength={60} />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            name="lat"
            label="latitude"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="28.613900"
            required
          />
          <TextField
            name="lng"
            label="longitude"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="77.209000"
            required
          />
        </div>
        <TextField
          name="radius_m"
          label="radius (metres)"
          type="number"
          min={RADIUS_MIN_M}
          max={RADIUS_MAX_M}
          step={1}
          defaultValue={office?.radius_m ?? 150}
          hint="100–200 m covers most buildings and normal gps drift."
          required
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit">save location</Button>
          <Button variant="ghost" onClick={useMyLocation} pending={locating}>
            {locating ? "locating…" : "use my current location"}
          </Button>
          {mapHref ? (
            <a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-ha-muted underline">
              check on map
            </a>
          ) : null}
        </div>
      </form>
    </div>
  );
}
