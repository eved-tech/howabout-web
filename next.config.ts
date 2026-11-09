import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Every page here reads live vote counts and brand responses, so this is
  // the wrong fit for Cache Components' caching-by-default render model.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
