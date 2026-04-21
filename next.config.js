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
  experimental: {
    turbopack: {
      // 🌟 터보팩이 프로젝트 루트를 정확히 찾게 도와줍니다.
      root: '.',
    },
    // nodeMiddleware: true, // 미들웨어 사용 활성화
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

module.exports = nextConfig;
