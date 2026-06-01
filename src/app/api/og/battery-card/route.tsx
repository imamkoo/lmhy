import { ImageResponse } from "next/og";
import { ARCHETYPES, type ArchetypeId } from "@/data/mental-battery/archetypes";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const archetypeId = searchParams.get("archetype") as ArchetypeId;
    const score = searchParams.get("score");

    const archetype = ARCHETYPES[archetypeId] || ARCHETYPES["silent_burnout"];
    const batteryScore = score || "0";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            backgroundImage: `linear-gradient(to bottom right, ${
              archetype.accentColor || "#f8fafc"
            }, #ffffff)`,
            fontFamily: "sans-serif",
            padding: "40px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", position: "absolute", top: 40, left: 40 }}>
            <span style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}>Let Me Hear You</span>
          </div>
          
          <div style={{ display: "flex", position: "absolute", top: 40, right: 40 }}>
            <span style={{ fontSize: 24, fontWeight: "bold", color: "#666" }}>⚡ Mental Battery: {batteryScore}%</span>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "40px 60px",
              borderRadius: "32px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              border: "1px solid rgba(0,0,0,0.05)",
              marginTop: "20px",
            }}
          >
            <div style={{ fontSize: 100, marginBottom: 20 }}>{archetype.emoji}</div>
            <h1
              style={{
                fontSize: 60,
                fontWeight: 900,
                color: "#111",
                marginBottom: 10,
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              {archetype.name}
            </h1>
            <p style={{ fontSize: 30, color: "#666", fontStyle: "italic", textAlign: "center", marginBottom: 30 }}>
              "{archetype.tagline}"
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", maxWidth: "800px" }}>
              {archetype.signals.slice(0, 3).map((s) => (
                <div
                  key={s}
                  style={{
                    backgroundColor: "#f1f5f9",
                    padding: "10px 20px",
                    borderRadius: "20px",
                    fontSize: 20,
                    color: "#334155",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", position: "absolute", bottom: 40, fontSize: 24, color: "#888" }}>
            Cek kondisi mentalmu gratis di mentalbattery.lmhy.id
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
