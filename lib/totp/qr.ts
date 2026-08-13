import QRCode from "qrcode";

export async function qrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#1C1C2E", light: "#FFFFFF" },
  });
}
