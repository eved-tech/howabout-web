"use client";

import { useEffect, useState } from "react";

// Placeholder set for the hero's "what can ___ do better?" loop. Drop more
// logos into public/brand-logos and add them here as the real brand-logo
// pipeline (Google Sheet + Vercel Blob, see the feature wish-list doc) lands.
const LOGOS = [
  { src: "/brand-logos/woolworths.png", alt: "Woolworths" },
  { src: "/brand-logos/takealot.png", alt: "Takealot" },
  { src: "/brand-logos/gautrain.png", alt: "Gautrain" },
];

export function RotatingBrandLogo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % LOGOS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-grid",
        placeItems: "center",
        verticalAlign: "middle",
        height: "0.78em",
        width: "2.6em",
        margin: "0 0.1em",
      }}
    >
      {LOGOS.map((logo, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={logo.src}
          src={logo.src}
          alt=""
          style={{
            gridArea: "1 / 1",
            maxHeight: "1.55em",
            maxWidth: "2.6em",
            objectFit: "contain",
            transform: `rotate(-5deg) scale(${i === index ? 1 : 0.8})`,
            opacity: i === index ? 1 : 0,
            transition: "opacity 0.45s ease, transform 0.45s ease",
          }}
        />
      ))}
    </span>
  );
}
