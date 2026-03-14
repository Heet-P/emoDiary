import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Bypass SSL certificate validation in development (fix for corporate proxies/AV)
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export default nextConfig;
