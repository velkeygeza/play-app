import { useState } from "react";
import { supabase } from "../lib/supabase";

export function AuthGate({ session, children }) {
  const [mode, setMode] = useState("login"); // "login" vagy "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (session) {
    // Ha van bejelentkezett user, simán mutatjuk az appot
    return children;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split("@")[0],
            },
          },
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(circle at top, #1e293b 0, #020617 45%, #020617 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: "#020617",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
          border: "1px solid #1f2937",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          PLAY
        </div>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 18 }}>
          Jelentkezz be vagy regisztrálj, hogy szabad időpontokat foglalj
          budapesti szórakozóhelyekre.
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <input
              type="email"
              placeholder="E-mail cím"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #374151",
                backgroundColor: "#020617",
                color: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input
              type="password"
              placeholder="Jelszó"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #374151",
                backgroundColor: "#020617",
                color: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>
          {error && (
            <div
              style={{
                fontSize: 12,
                color: "#fecaca",
                marginBottom: 8,
                whiteSpace: "pre-wrap",
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 999,
              border: "none",
              backgroundColor: "#00B8A9",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              cursor: busy ? "default" : "pointer",
              marginBottom: 8,
            }}
          >
            {busy
              ? "Feldolgozás..."
              : mode === "login"
              ? "Belépés"
              : "Regisztráció"}
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            setMode((m) => (m === "login" ? "signup" : "login"))
          }
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            background: "transparent",
            color: "#9ca3af",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {mode === "login"
            ? "Még nincs fiókod? Regisztrálj"
            : "Már van fiókod? Jelentkezz be"}
        </button>
      </div>
    </div>
  );
}
