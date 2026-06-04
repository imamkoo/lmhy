import { ImageResponse } from "next/og";
import { ARCHETYPES, type ArchetypeId } from "@/data/mental-battery/archetypes";
import { SEVERITY_LABELS, type SeverityLevel } from "@/lib/mental-battery-constants";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const archetypeId = searchParams.get("archetype") as ArchetypeId;
    const score = searchParams.get("score") || "0";
    
    // Extract submetrics
    const stress = (searchParams.get("stress") as SeverityLevel) || "rendah";
    const recovery = (searchParams.get("recovery") as SeverityLevel) || "rendah";
    const focus = (searchParams.get("focus") as SeverityLevel) || "rendah";
    const emotional = (searchParams.get("emotional") as SeverityLevel) || "rendah";

    const archetype = ARCHETYPES[archetypeId] || ARCHETYPES["silent_burnout"];
    const baseUrl = new URL(request.url).origin;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fff",
            backgroundImage: `linear-gradient(to bottom right, ${
              archetype.accentColor || "#f8fafc"
            }, #ffffff)`,
            fontFamily: "sans-serif",
            padding: "50px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${baseUrl}/assets/LMHY.png`} alt="LMHY" width="60" height="60" style={{ borderRadius: "12px" }} />
              <span style={{ fontSize: 32, fontWeight: "bold", color: "#334155", letterSpacing: "-1px" }}>Let Me Hear You</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", backgroundColor: "rgba(255,255,255,0.9)", padding: "10px 24px", borderRadius: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
              <span style={{ fontSize: 32, fontWeight: "900", color: "#4f46e5", whiteSpace: "nowrap" }}>⚡ Mental Battery: {score}%</span>
            </div>
          </div>

          {/* Main Layout */}
          <div style={{ display: "flex", width: "100%", gap: "30px", flex: 1 }}>
            
            {/* Left side: Archetype */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                padding: "30px",
                borderRadius: "32px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.05)",
                flex: 1.2,
              }}
            >
              <div style={{ fontSize: 100, marginBottom: 10 }}>{archetype.emoji}</div>
              <h1
                style={{
                  fontSize: 46,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 10,
                  textAlign: "center",
                  lineHeight: 1.1,
                }}
              >
                {archetype.name}
              </h1>
              <p style={{ fontSize: 24, color: "#64748b", fontStyle: "italic", textAlign: "center", marginBottom: 0 }}>
                "{archetype.tagline}"
              </p>
            </div>

            {/* Right side: Sub metrics */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "12px", justifyContent: "center" }}>
              <div style={{ display: "flex", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "20px", padding: "12px 20px", flexDirection: "column", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                <span style={{ fontSize: 18, color: "#64748b", marginBottom: "4px" }}>Stress Level</span>
                <span style={{ fontSize: 28, fontWeight: "bold", color: "#1e293b", whiteSpace: "nowrap" }}>{SEVERITY_LABELS[stress]?.emoji} {SEVERITY_LABELS[stress]?.label}</span>
              </div>
              
              <div style={{ display: "flex", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "20px", padding: "12px 20px", flexDirection: "column", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                <span style={{ fontSize: 18, color: "#64748b", marginBottom: "4px" }}>Recovery Score</span>
                <span style={{ fontSize: 28, fontWeight: "bold", color: "#1e293b", whiteSpace: "nowrap" }}>{SEVERITY_LABELS[recovery]?.emoji} {SEVERITY_LABELS[recovery]?.label}</span>
              </div>

              <div style={{ display: "flex", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "20px", padding: "12px 20px", flexDirection: "column", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                <span style={{ fontSize: 18, color: "#64748b", marginBottom: "4px" }}>Focus Capacity</span>
                <span style={{ fontSize: 28, fontWeight: "bold", color: "#1e293b", whiteSpace: "nowrap" }}>{SEVERITY_LABELS[focus]?.emoji} {SEVERITY_LABELS[focus]?.label}</span>
              </div>

              <div style={{ display: "flex", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "20px", padding: "12px 20px", flexDirection: "column", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                <span style={{ fontSize: 18, color: "#64748b", marginBottom: "4px" }}>Emotional Load</span>
                <span style={{ fontSize: 28, fontWeight: "bold", color: "#1e293b", whiteSpace: "nowrap" }}>{SEVERITY_LABELS[emotional]?.emoji} {SEVERITY_LABELS[emotional]?.label}</span>
              </div>
            </div>

          </div>

          <div style={{ display: "flex", width: "100%", justifyContent: "center", marginTop: "24px" }}>
             <span style={{ fontSize: 22, color: "#64748b", fontWeight: "bold" }}>Cek kondisi mentalmu gratis di mentalbattery.lmhy.id</span>
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
