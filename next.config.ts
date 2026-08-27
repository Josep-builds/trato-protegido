import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB. Buyer verification uploads two photos up to 5MB
    // each (see src/lib/validation.ts), so the default silently rejects
    // the request before verifyBuyer() ever runs.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
