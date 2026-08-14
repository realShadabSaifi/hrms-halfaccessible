export const APP_NAME_MAX = 40;
export const LOGO_MAX_BYTES = 1_048_576;
export const LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

const EXT: Record<(typeof LOGO_MIME_TYPES)[number], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export function validateAppName(name: string): string | null {
  const t = name.trim();
  if (!t) return "name required";
  if (t.length > APP_NAME_MAX) return "name too long";
  return null;
}

export function validateLogoFile(file: { type: string; size: number }): string | null {
  if (!LOGO_MIME_TYPES.includes(file.type as (typeof LOGO_MIME_TYPES)[number])) {
    return "unsupported file type";
  }
  if (file.size <= 0) return "empty file";
  if (file.size > LOGO_MAX_BYTES) return "file too large";
  return null;
}

export function logoExtension(mime: string): string | null {
  return EXT[mime as (typeof LOGO_MIME_TYPES)[number]] ?? null;
}
