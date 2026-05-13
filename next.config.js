/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone', // Docker 빌드를 위해
  reactStrictMode: true,
  // 🌟 여기에 추가하세요!
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 모든 https 도메인 허용
      },
      {
        protocol: 'http',
        hostname: '**', // 모든 http 도메인 허용
      },
    ],
  },
  // output: "standalone", // PM2 실행 시 필요
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

module.exports = nextConfig;
