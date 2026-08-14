import QRCode from "qrcode";

export async function qrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#39325A", light: "#FFFFFF" },
  });
}
