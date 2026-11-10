import Link from "next/link";

export function PageShell({
  title,
  subtitle,
  maxWidth = 420,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  maxWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="hb-page" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "56px 24px",
        }}
      >
        <Link href="/" aria-label="How About, home" style={{ display: "inline-flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="how about…?" style={{ height: 40, width: "auto" }} />
        </Link>

        <div
          style={{
            marginTop: 40,
            width: "100%",
            maxWidth,
            background: "#ffffff",
            border: "2.5px solid var(--hb-ink)",
            borderRadius: 28,
            boxShadow: "8px 8px 0 var(--hb-ink)",
            padding: "clamp(28px, 5vw, 40px)",
          }}
        >
          <h1
            className="hb-heading"
            style={{ margin: 0, fontWeight: 600, fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.01em" }}
          >
            {title}
          </h1>
          {subtitle && (
            <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.5, color: "#3A322C" }}>{subtitle}</div>
          )}
          <div style={{ marginTop: 24 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
