import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f7f9ff",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#7658f5",
            border: "7px solid #242033",
            borderRadius: 40,
            color: "#ffffff",
            display: "flex",
            fontFamily: "Arial, sans-serif",
            fontSize: 56,
            fontWeight: 800,
            height: 132,
            justifyContent: "center",
            width: 132,
          }}
        >
          ME
        </div>
      </div>
    ),
    size,
  );
}
