import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
            border: "18px solid #242033",
            borderRadius: 112,
            color: "#ffffff",
            display: "flex",
            fontFamily: "Arial, sans-serif",
            fontSize: 156,
            fontWeight: 800,
            height: 360,
            justifyContent: "center",
            width: 360,
          }}
        >
          ME
        </div>
      </div>
    ),
    size,
  );
}
