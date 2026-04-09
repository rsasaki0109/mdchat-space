import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["http://127.0.0.1:3030", "http://localhost:3030"],
};

export default nextConfig;
