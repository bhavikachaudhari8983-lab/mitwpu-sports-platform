"use client";

/** Last-resort boundary (root layout failed) — must render its own <html>. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F8FAFC", color: "#0F172A", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0, padding: 16 }}>
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 28 }}>The portal is temporarily unavailable</h1>
          <p style={{ color: "#475569" }}>Please try again in a moment.</p>
          <button onClick={reset} style={{ minHeight: 44, padding: "0 20px", borderRadius: 8, border: 0, background: "#F97316", color: "#0F172A", fontWeight: 600, fontSize: 16 }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
