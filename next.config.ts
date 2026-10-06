import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev server is often reached through a proxy hostname, which otherwise
  // triggers a cross-origin warning for every /_next/* request.
  allowedDevOrigins: ["*.prod-runtime.all-hands.dev", "localhost", "127.0.0.1"],
  // `three` ships ESM-only sub-modules; transpiling keeps the worker/loader
  // imports consistent between the client and the server bundle.
  transpilePackages: ["three"],
  webpack: (config) => {
    // gif.js references its worker via `new Worker(...)`; the webpack 5 asset
    // loader is the simplest way to keep that reference intact at runtime.
    config.module.rules.push({
      test: /gif\.worker\.min\.js$/,
      type: "asset/resource",
    });
    return config;
  },
  async headers() {
    return [
      {
        // WebCodecs + OffscreenCanvas require a cross-origin-isolated context
        // for the highest-quality encoders. These headers enable it.
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
