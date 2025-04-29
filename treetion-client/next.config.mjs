/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  eslint: {
    // 빌드 시 ESLint 검사를 건너뛰려면 true로 설정
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
