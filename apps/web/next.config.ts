import type { NextConfig } from "next";

const rawBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath =
  rawBase && rawBase !== "/" ? rawBase.replace(/\/$/, "") : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
  allowedDevOrigins: [
    "http://127.0.0.1:3030",
    "http://localhost:3030",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ],
};

if (process.env.MDCHAT_STATIC_EXPORT === "1") {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
}

export default nextConfig;
