import { ImageResponse } from "next/og";
import { profile } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#000000",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          <span style={{ color: "#ff5a2e", fontSize: 40, marginRight: 16 }}>{"›"}</span>
          <span style={{ color: "#8a8175", fontSize: 28 }}>visitor@{profile.handle}: ~</span>
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: "#f4ede1", letterSpacing: -2 }}>
          {profile.name}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#bcd6ad", marginTop: 20 }}>{profile.role}</div>
        <div style={{ display: "flex", fontSize: 24, color: "#9c9384", marginTop: 28, maxWidth: 900 }}>
          {profile.tagline}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#ff5a2e", marginTop: 36, letterSpacing: 2 }}>
          {profile.capabilityTags.join("  ·  ")}
        </div>
      </div>
    ),
    { ...size },
  );
}
