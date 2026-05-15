/** @type {import('next').NextConfig} */

const imageRemotePatterns = (process.env.NEXT_IMAGE_REMOTE_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean)
  .map((hostname) => ({
    protocol: "https",
    hostname,
  }));

const imageRemoteHosts = imageRemotePatterns.map(({ hostname }) => `https://${hostname}`);
const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" "),
  "style-src 'self' 'unsafe-inline'",
  ["img-src", "'self'", "data:", "blob:", ...imageRemoteHosts].join(" "),
  "font-src 'self' data:",
  "media-src 'self' data: blob:",
  "connect-src 'self' http: https: ws: wss:",
  "worker-src 'self' blob:",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)",
  },
];

const nextConfig = {
  output: 'standalone', // Docker 빌드를 위해
  reactStrictMode: true,
  images: {
    remotePatterns: imageRemotePatterns,
  },
  // output: "standalone", // PM2 실행 시 필요
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
