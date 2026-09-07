import { ImageResponse } from "next/og";

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const n = size === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#7463D4",
          color: "#FFFFFF",
          fontSize: n === 512 ? 180 : 72,
          fontWeight: 700,
        }}
      >
        ha
      </div>
    ),
    { width: n, height: n },
  );
}
