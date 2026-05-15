/** @type {import('next').NextConfig} */

const imageRemotePatterns = (process.env.NEXT_IMAGE_REMOTE_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean)
  .map((hostname) => ({
    protocol: "https",
    hostname,
  }));

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
};

module.exports = nextConfig;
