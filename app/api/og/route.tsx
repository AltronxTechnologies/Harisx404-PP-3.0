import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title") || "Muhammad Haris — Portfolio";
    const category = searchParams.get("category") || "Full-Stack & AI";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "#0d1117",
            backgroundImage:
              "radial-gradient(circle at 25px 25px, #1f293d 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1f293d 2%, transparent 0%)",
            backgroundSize: "100px 100px",
            padding: "80px",
            position: "relative",
            fontFamily: "sans-serif",
          }}
        >
          {/* Ambient Glow */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%)",
            }}
          />

          {/* Top Row: Brand & Category Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#4f46e5",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "24px",
                }}
              >
                H
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  Muhammad Haris
                </span>
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: "14px",
                  }}
                >
                  @harisx404
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 20px",
                borderRadius: "9999px",
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#a5b4fc",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {category}
            </div>
          </div>

          {/* Center: Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "1000px",
            }}
          >
            <h1
              style={{
                fontSize: "56px",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Bottom Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "24px",
            }}
          >
            <span
              style={{
                color: "#64748b",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              Full-Stack MERN Developer · AI &amp; Cybersecurity
            </span>
            <span
              style={{
                color: "#818cf8",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              harisx404.vercel.app
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
