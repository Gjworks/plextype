/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone', // Docker 빌드를 위해
  reactStrictMode: true,
  // output: "standalone", // PM2 실행 시 필요
  experimental: {
    // nodeMiddleware: true, // 미들웨어 사용 활성화
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

module.exports = nextConfig;
