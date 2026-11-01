import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cafe/shared"],
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
