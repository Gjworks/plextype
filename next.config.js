/** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   swcMinify: true,
//   experimental: {
//     appDir: 'src/app',
//     serverActions: true,
//     serverComponents: true,
//   },
// }

const nextConfig = {
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
