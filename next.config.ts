import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // necessario pro deploy Docker (self-host .107)
  // reactCompiler: true,  // requer babel-plugin-react-compiler como dep formal; reabilitar pos-cutover
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
