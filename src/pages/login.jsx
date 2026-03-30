import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { BACKEND_URL, GAME_ID } from "../constants";

// Safe read from index.html
const config = window.APP_CONFIG || {};

const firebaseConfig = config.firebaseConfig;

// Initialize Firebase only if config exists
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const provider = new GoogleAuthProvider();

// Force selection of student domain accounts (Optional but recommended)
provider.setCustomParameters({
  hd: "iiitl.ac.in",
  prompt: "select_account"
});

export default function Login() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async () => {
    if (!auth) {
      setStatus("Firebase config missing.");
      return;
    }

    setLoading(true);
    setStatus("Logging in...");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const idToken = await user.getIdToken();
      setStatus("Authenticating with server...");

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idToken,
          gameId: GAME_ID
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(data.message || "Successfully tracked participation!");
        localStorage.setItem("idToken", idToken);

        setTimeout(() => {
          window.location.href = "/game";
        }, 1000);
      } else {
        setStatus(data.error || "Failed to record tracking info.");
      }
    } catch (error) {
      console.error(error);
      setStatus("Error logging in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "min(92vw, 440px)",
          padding: "clamp(24px, 5vw, 40px)",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
          textAlign: "center",
          color: "white",
          boxSizing: "border-box"
        }}
      >
        {/* <div
          style={{
            display: "inline-block",
            padding: "8px 14px",
            borderRadius: "999px",
            background: "rgba(59,130,246,0.16)",
            color: "#bfdbfe",
            fontSize: "clamp(12px, 2vw, 14px)",
            fontWeight: "600",
            marginBottom: "18px",
            wordBreak: "break-word"
          }}
        >
          {GAME_ID || "Not Set"} 
        </div> */}

        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(26px, 5vw, 34px)",
            fontWeight: "800",
            letterSpacing: "-0.02em"
          }}
        >
          🎮 {GAME_ID || "Not Set"}
        </h1>

        <p
          style={{
            margin: "0 0 26px",
            color: "#cbd5e1",
            fontSize: "clamp(13px, 2vw, 15px)",
            lineHeight: "1.6"
          }}
        >
          Sign in using your institute email to continue
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 16px",
            border: "none",
            borderRadius: "14px",
            background: loading ? "#475569" : "#2563eb",
            color: "white",
            fontSize: "clamp(14px, 2vw, 16px)",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 10px 24px rgba(37,99,235,0.35)"
          }}
        >
          {loading ? "Please wait..." : "Login with Email"}
        </button>

        {status && (
          <p
            style={{
              marginTop: "18px",
              marginBottom: 0,
              fontSize: "clamp(13px, 2vw, 14px)",
              lineHeight: "1.5",
              color: status.toLowerCase().includes("success") ? "#4ade80" : "#e2e8f0",
              wordBreak: "break-word"
            }}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
