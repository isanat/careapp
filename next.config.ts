import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Disable turbo temporarily to fix cache issues
  },
  // Empty turbopack config to silence warning
  turbopack: {},
  headers: async () => [
    // Security headers for all routes
    {
      source: "/:path(.*)",
      headers: [
        // Prevent clickjacking
        { key: "X-Frame-Options", value: "DENY" },
        // Prevent MIME type sniffing
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Enable XSS protection in older browsers
        { key: "X-XSS-Protection", value: "1; mode=block" },
        // Control referrer information
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // Enable HTTPS and HSTS
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        // Content Security Policy
        {
          key: "Content-Security-Policy",
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://checkout.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-src https://checkout.stripe.com https://js.stripe.com; connect-src 'self' https://api.stripe.com https://checkout.stripe.com; object-src 'none';"
        },
        // Permissions Policy (formerly Feature Policy)
        {
          key: "Permissions-Policy",
          value: "geolocation=(), microphone=(), camera=(), payment=(self), usb=()"
        },
      ],
    },
    // Static assets cache headers
    {
      source: "/:path*.svg",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/icons/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
