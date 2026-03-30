import { useEffect } from "react";

export default function Game() {
  useEffect(() => {
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.width = "100%";
    document.documentElement.style.height = "100%";

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.background = "#0f172a";
    document.body.style.overflow = "hidden";

    const root = document.getElementById("root");
    if (root) {
      root.style.width = "100%";
      root.style.height = "100%";
    }
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
        fontFamily: "Arial, sans-serif",
        color: "white",
        overflow: "hidden",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          width: "min(90vw, 500px)",
          padding: "40px",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
          textAlign: "center"
        }}
      >
        <h1
          style={{
            margin: "0 0 14px",
            fontSize: "36px",
            fontWeight: "800"
          }}
        >
          🎮 Game Page
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "16px",
            color: "#cbd5e1"
          }}
        >
          Your game starts here
        </p>
      </div>
    </div>
  );
}
