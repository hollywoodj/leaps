import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#007AFF",
        }}
      >
        <div
          style={{
            width: 118,
            height: 118,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            border: "10px solid white",
            borderRadius: 59,
            gap: 10,
            paddingBottom: 16,
          }}
        >
          <div style={{ width: 16, height: 36, background: "white", borderRadius: 8 }} />
          <div style={{ width: 16, height: 58, background: "white", borderRadius: 8 }} />
          <div style={{ width: 16, height: 78, background: "white", borderRadius: 8 }} />
        </div>
      </div>
    ),
    size,
  );
}
