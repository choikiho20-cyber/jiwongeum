/** @type {import('next').NextConfig} */
// GitHub Pages가 /jiwongeum/ 하위 경로로 서빙하므로 basePath를 맞춘다.
// 나중에 커스텀 도메인을 붙이면 루트가 되므로 이 줄을 지워야 한다.
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/jiwongeum",
};

export default nextConfig;
