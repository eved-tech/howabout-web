import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/app/auth/actions";
import { auth } from "@/lib/auth/server";
import { colorFor } from "@/lib/palette";
import { IdeaFeed, type IdeaOrders, type IdeaVM } from "./IdeaFeed";
import { RotatingBrandLogo } from "./RotatingBrandLogo";

export const dynamic = "force-dynamic";

// Real logo files we have on hand, keyed by lowercase brand name — used to
// upgrade the "Brands South Africans are talking to" tiles from a flat
// placeholder swatch to the real mark once we have one.
const KNOWN_BRAND_LOGOS: Record<string, string> = {
  woolworths: "/brand-logos/woolworths.png",
  takealot: "/brand-logos/takealot.png",
  gautrain: "/brand-logos/gautrain.png",
};

// Recognisable brands to show alongside real registered ones, even before
// they have an idea or a Brand record of their own — placeholder "trust"
// logos until the real brand-seeding pipeline lands (see feature wish-list doc).
const GUEST_BRAND_LOGOS = [
  { name: "Takealot", logo: KNOWN_BRAND_LOGOS.takealot },
  { name: "Gautrain", logo: KNOWN_BRAND_LOGOS.gautrain },
];

// Hard-coded, not pulled from real submissions — just a lively sample of the
// kind of thing people post, for the hero's scrolling ticker.
const HERO_TICKER_IDEAS = [
  "Woolworths: bring back the loyalty stamp card",
  "Takealot: let me schedule delivery for after 6pm",
  "Gautrain: Wi-Fi that actually works",
  "Capitec: branches open on a Saturday",
  "Mr Price: size guides that make sense",
  "Checkers: a trolley that doesn't pull left",
];

async function loadIdeas(currentUserId: string | null) {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [newIdeasCount, rows] = await Promise.all([
    prisma.idea.count({ where: { createdAt: { gte: since24h }, brand: { approved: true } } }),
    prisma.idea.findMany({
      where: {
        brand: { approved: true },
        OR: [{ moderationStatus: null }, { moderationStatus: "CLEAR" }],
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        brand: { select: { name: true, slug: true, claimed: true } },
        author: { select: { name: true, email: true } },
        _count: { select: { votes: true } },
      },
    }),
  ]);

  const ideaIds = rows.map((r) => r.id);

  const [recentVoteCounts, myVotes] = await Promise.all([
    prisma.vote.groupBy({
      by: ["ideaId"],
      where: { createdAt: { gte: since48h }, ideaId: { in: ideaIds } },
      _count: { _all: true },
    }),
    currentUserId
      ? prisma.vote.findMany({
          where: { userId: currentUserId, ideaId: { in: ideaIds } },
          select: { ideaId: true },
        })
      : Promise.resolve([]),
  ]);

  const recentVotesByIdea = new Map(recentVoteCounts.map((r) => [r.ideaId, r._count._all]));
  const myVotedIds = new Set(myVotes.map((v) => v.ideaId));

  const ideas: IdeaVM[] = rows.map((idea) => ({
    id: idea.id,
    headline: idea.headline,
    body: idea.body,
    category: idea.category,
    brandName: idea.brand.name,
    brandSlug: idea.brand.slug,
    brandClaimed: idea.brand.claimed,
    responded: idea.response !== null,
    authorName: idea.author?.name?.trim() || idea.author?.email?.split("@")[0] || "Someone",
    votes: idea._count.votes,
    voted: myVotedIds.has(idea.id),
    commentsCount: 0,
    reportable: idea.moderationStatus === null,
    reported: idea.reportedAt !== null,
  }));

  const latest = [...ideas].sort((a, b) => rows.findIndex((r) => r.id === a.id) - rows.findIndex((r) => r.id === b.id));
  const popular = [...ideas].sort((a, b) => b.votes - a.votes);
  const growing = [...ideas].sort((a, b) => {
    const diff = (recentVotesByIdea.get(b.id) ?? 0) - (recentVotesByIdea.get(a.id) ?? 0);
    return diff !== 0 ? diff : b.votes - a.votes;
  });
  const comments = popular; // no comments feature yet — tie-break on votes
  const cheering = popular.filter((i) => i.voted);

  const orders: IdeaOrders = {
    latest: latest.map((i) => i.id),
    popular: popular.map((i) => i.id),
    growing: growing.map((i) => i.id),
    comments: comments.map((i) => i.id),
    cheering: cheering.map((i) => i.id),
  };

  return { newIdeasCount, ideas, orders };
}

export default async function HomePage() {
  const { data: session } = await auth.getSession();

  let currentUserId: string | null = null;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    currentUserId = user?.id ?? null;
  }

  const [{ newIdeasCount, ideas, orders }, brands] = await Promise.all([
    loadIdeas(currentUserId),
    prisma.brand.findMany({
      where: { approved: true },
      orderBy: { name: "asc" },
      take: 20,
      select: { name: true, slug: true },
    }),
  ]);

  return (
    <div className="hb-page" style={{ overflow: "hidden" }}>
      <header style={{ borderBottom: "1.5px solid var(--hb-divider)", background: "var(--hb-page)" }}>
        <nav
          aria-label="Main"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <a href="#top" aria-label="How About, home" style={{ display: "inline-flex", textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="how about…?" style={{ height: 48, width: "auto" }} />
          </a>
          <div className="hb-navlinks">
            <a className="hb-navlink" href="#ideas">Ideas</a>
            <a className="hb-navlink" href="#prizes">Prizes</a>
            <a className="hb-navlink" href="#brand-logos">Brands</a>
            <a className="hb-navlink" href="#">Newsletter</a>
            <a className="hb-navlink" href="#">Work with us</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {session?.user ? (
              <form action={signOut} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="hidden" name="redirectTo" value="/" />
                <span className="hb-hide-s" style={{ fontSize: 15 }}>
                  {session.user.name ?? session.user.email}
                </span>
                <button type="submit" className="hb-btn hb-btn-c hb-btn-s">
                  Sign out
                </button>
              </form>
            ) : (
              <>
                <Link className="hb-navlink hb-hide-s" href="/auth/sign-in">
                  Log in
                </Link>
                <Link className="hb-btn hb-btn-o hb-btn-s" href="/auth/sign-up">
                  Sign up
                </Link>
              </>
            )}
            <button className="hb-menu-btn" type="button" aria-label="Menu">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h16M3 11h16M3 16h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      <section id="top" style={{ position: "relative", overflow: "hidden", padding: "104px 24px 72px", textAlign: "center" }}>
        <div className="hb-deco" aria-hidden="true" style={{ position: "absolute", left: -70, top: 60, transform: "rotate(-12deg)" }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <polygon
              points="100.0,8.0 115.6,31.8 139.9,17.1 143.6,45.3 171.9,42.6 163.1,69.6 189.7,79.5 170.0,100.0 189.7,120.5 163.1,130.4 171.9,157.4 143.6,154.7 139.9,182.9 115.6,168.2 100.0,192.0 84.4,168.2 60.1,182.9 56.4,154.7 28.1,157.4 36.9,130.4 10.3,120.5 30.0,100.0 10.3,79.5 36.9,69.6 28.1,42.6 56.4,45.3 60.1,17.1 84.4,31.8"
              fill="#FFD36B"
              stroke="#1F1A17"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="hb-deco" aria-hidden="true" style={{ position: "absolute", right: 40, top: 80, transform: "rotate(8deg)" }}>
          <svg width="150" height="150" viewBox="0 0 190 190">
            <circle cx="95" cy="95" r="86" fill="#FFB8CC" stroke="#1F1A17" strokeWidth="3.5" />
            <path d="M95 138V58M62 90l33-33 33 33" fill="none" stroke="#1F1A17" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="hb-deco" aria-hidden="true" style={{ position: "absolute", right: 190, top: 340, transform: "rotate(10deg)" }}>
          <svg width="130" height="130" viewBox="0 0 100 100">
            <g stroke="#1F1A17" strokeWidth="3.5">
              <circle cx="50" cy="26" r="22" fill="#D4C2F7" />
              <circle cx="50" cy="74" r="22" fill="#D4C2F7" />
              <circle cx="26" cy="50" r="22" fill="#D4C2F7" />
              <circle cx="74" cy="50" r="22" fill="#D4C2F7" />
            </g>
            <circle cx="50" cy="50" r="9" fill="#FF751F" stroke="#1F1A17" strokeWidth="3" />
          </svg>
        </div>

        <div style={{ position: "relative", maxWidth: 1120, margin: "0 auto" }}>
          <h1
            className="hb-heading"
            style={{ margin: 0, fontWeight: 600, fontSize: "clamp(40px, 7.4vw, 96px)", lineHeight: 1.04, letterSpacing: "-0.01em" }}
          >
            What can <RotatingBrandLogo />
            <span className="hb-sr">brands</span> do better?
          </h1>
          <p style={{ margin: "32px auto 0", maxWidth: 620, fontSize: 21, lineHeight: 1.5, color: "#3A322C" }}>
            South Africans tell brands how to do better. Everyone votes. The best ideas rise, get noticed, and win prizes.
          </p>
          <p style={{ margin: "14px auto 0", maxWidth: 620, fontSize: 21, lineHeight: 1.5, color: "#3A322C", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
            <span aria-hidden="true">🇿🇦</span>
            {newIdeasCount} ideas submitted today
          </p>
          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <Link className="hb-btn hb-btn-o" href="/submit">Share <em style={{ marginInline: "0.18em" }}>your</em> idea</Link>
          </div>
          <div className="hb-ticker" style={{ marginTop: 48 }}>
            <div className="hb-ticker-track">
              {[...HERO_TICKER_IDEAS, ...HERO_TICKER_IDEAS].map((text, i) => (
                <span key={i} className="hb-chip" style={{ fontSize: 15, fontWeight: 600 }}>
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="ideas" style={{ background: "var(--hb-page)" }}>
        <div className="hb-ideas-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 96px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ maxWidth: 720 }}>
              <h2 className="hb-heading" style={{ margin: 0, fontWeight: 600, fontSize: "clamp(32px, 5.4vw, 60px)", lineHeight: 1.08, letterSpacing: "-0.01em" }}>
                We’ve got some ideas…
              </h2>
            </div>

            <IdeaFeed ideas={ideas} orders={orders} signedIn={currentUserId !== null} />
          </div>

          <aside
            style={{
              border: "2px dashed var(--hb-chip-border)",
              borderRadius: 24,
              padding: 28,
              minHeight: 240,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 8,
              color: "#6b5f55",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>Competitions &amp; promos</span>
            <span style={{ fontSize: 14 }}>Coming soon</span>
          </aside>
        </div>
      </section>

      <section id="submit" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 32px" }}>
        <div
          style={{
            background: "#FFD36B",
            border: "2.5px solid var(--hb-ink)",
            borderRadius: 40,
            boxShadow: "8px 8px 0 var(--hb-ink)",
            padding: "clamp(32px, 5vw, 64px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div>
            <h2 className="hb-heading" style={{ margin: 0, fontWeight: 600, fontSize: "clamp(34px, 5.6vw, 64px)", lineHeight: 1.02, letterSpacing: "-0.01em" }}>
              Got an idea for a brand?
            </h2>
            <p style={{ margin: "20px 0 0", maxWidth: 460, fontSize: 20, lineHeight: 1.5, color: "#2B2420" }}>
              Pick a brand, tell it how to be better, and let South Africa vote.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label className="hb-sr" htmlFor="idea-in">Your idea</label>
            <input
              id="idea-in"
              type="text"
              placeholder="How about…"
              readOnly
              style={{
                boxSizing: "border-box",
                width: "100%",
                height: 68,
                padding: "0 28px",
                border: "2.5px solid var(--hb-ink)",
                borderRadius: 999,
                background: "#FFFFFF",
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--hb-ink)",
              }}
            />
            <Link className="hb-btn hb-btn-k hb-btn-l" href="/submit">
              Submit your idea
            </Link>
          </div>
        </div>
      </section>

      {brands.length > 0 && (
        <section id="brand-logos" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 104px" }}>
          <h2 className="hb-heading" style={{ margin: "0 0 32px", textAlign: "center", fontWeight: 600, fontSize: "clamp(26px, 3.4vw, 38px)", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            Brands South Africans are talking to
          </h2>
          <div className="hb-logos">
            {brands.map((brand) => {
              const logo = KNOWN_BRAND_LOGOS[brand.name.toLowerCase()];
              return (
                <Link key={brand.slug} href={`/brands/${brand.slug}`} className="hb-logo-tile" style={{ textDecoration: "none", color: "inherit" }}>
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="" style={{ maxWidth: 36, maxHeight: 28, objectFit: "contain" }} />
                  ) : (
                    <span className="hb-logo-mark" style={{ background: colorFor(brand.name) }} aria-hidden="true"></span>
                  )}
                  <span>{brand.name}</span>
                </Link>
              );
            })}
            {GUEST_BRAND_LOGOS.filter(
              (guest) => !brands.some((brand) => brand.name.toLowerCase() === guest.name.toLowerCase())
            ).map((guest) => (
              <div key={guest.name} className="hb-logo-tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={guest.logo} alt="" style={{ maxWidth: 36, maxHeight: 28, objectFit: "contain" }} />
                <span>{guest.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="prizes" style={{ background: "var(--hb-orange)", borderTop: "1.5px solid var(--hb-divider)", borderBottom: "1.5px solid var(--hb-divider)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Prizes</div>
            <h2 className="hb-heading" style={{ margin: "12px 0 0", fontWeight: 600, fontSize: "clamp(38px, 6vw, 72px)", lineHeight: 1.04, letterSpacing: "-0.01em" }}>
              Good ideas win prizes.
            </h2>
            <p style={{ margin: "24px 0 0", maxWidth: 480, fontSize: 20, lineHeight: 1.5 }}>
              The best ideas get rewarded, not just applauded. [PRIZE DETAILS: what can be won, how often, who judges.]
            </p>
            <a className="hb-btn hb-btn-c" href="#prize-info" style={{ marginTop: 36, display: "inline-flex" }}>See the prizes</a>
          </div>
          <div style={{ position: "relative", height: 320 }} aria-hidden="true">
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 36,
                top: 10,
                transform: "rotate(-4deg)",
                background: "#FFFFFF",
                border: "2.5px solid var(--hb-ink)",
                borderRadius: 22,
                boxShadow: "6px 6px 0 var(--hb-ink)",
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Best idea</div>
                <div className="hb-heading" style={{ fontSize: 34, lineHeight: 1.1, marginTop: 4 }}>[PRIZE]</div>
              </div>
              <div style={{ borderLeft: "2.5px dashed var(--hb-ink)", paddingLeft: 20, alignSelf: "stretch", display: "grid", placeItems: "center" }}>
                <svg width="40" height="40" viewBox="0 0 44 44">
                  <polygon points="22,3 27.5,15.5 41,17 31,26.5 33.8,40 22,33 10.2,40 13,26.5 3,17 16.5,15.5" fill="#FFD36B" stroke="#1F1A17" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: 36,
                right: 0,
                top: 170,
                transform: "rotate(3deg)",
                background: "#FFFFFF",
                border: "2.5px solid var(--hb-ink)",
                borderRadius: 22,
                boxShadow: "6px 6px 0 var(--hb-ink)",
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>[CATEGORY]</div>
                <div className="hb-heading" style={{ fontSize: 34, lineHeight: 1.1, marginTop: 4 }}>[PRIZE]</div>
              </div>
              <div style={{ borderLeft: "2.5px dashed var(--hb-ink)", paddingLeft: 20, alignSelf: "stretch", display: "grid", placeItems: "center" }}>
                <svg width="40" height="40" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="#A9CCFF" stroke="#1F1A17" strokeWidth="2.5" />
                  <path d="M22 31V14M14 21l8-8 8 8" fill="none" stroke="#1F1A17" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ background: "var(--hb-ink)", color: "var(--hb-page)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 24px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 320 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="how about…?" style={{ height: 30, width: "auto", alignSelf: "flex-start" }} />
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: "#E9DFCB" }}>
                Ideas from South Africans, for the brands we deal with every day.
              </p>
            </div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap", fontSize: 17 }}>
              <a href="#ideas" style={{ textDecoration: "none", padding: "8px 0" }}>Ideas</a>
              <a href="#prizes" style={{ textDecoration: "none", padding: "8px 0" }}>Prizes</a>
              <a href="#terms" style={{ textDecoration: "none", padding: "8px 0" }}>Terms</a>
              <a href="#privacy" style={{ textDecoration: "none", padding: "8px 0" }}>Privacy</a>
            </div>
          </div>
          <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid #5A5048", fontSize: 14, color: "#E9DFCB" }}>
            © 2026 How About. Made in South Africa.
          </div>
        </div>
      </footer>
    </div>
  );
}
