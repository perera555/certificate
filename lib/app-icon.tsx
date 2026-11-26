import { ImageResponse } from "next/og";

export function appIcon(size: number) {
  const s = size / 512;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b1220 0%, #1e3a5f 100%)",
        }}
      >
        <div
          style={{
            width: 330 * s,
            height: 330 * s,
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #7a5c12 0%, #fff1a8 45%, #c9971c 70%, #f7dc7a 100%)",
            boxShadow: `0 ${10 * s}px ${30 * s}px rgba(0,0,0,.45)`,
          }}
        >
          <div
            style={{
              width: 250 * s,
              height: 250 * s,
              borderRadius: 9999,
              border: `${8 * s}px solid #3b2a00`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={150 * s} height={150 * s} viewBox="0 0 24 24">
              <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#3b2a00" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
