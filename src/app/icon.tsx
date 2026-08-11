import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#211b29",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 11,
            height: 11,
            background: "#bda3f5",
            borderRadius: 3,
            transform: "rotate(45deg)",
          }}
        />
      </div>
    ),
    size,
  );
}
