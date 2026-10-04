import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "manila-renewal-couch.ngrok-free.dev",
  ],
};

export default nextConfig;
