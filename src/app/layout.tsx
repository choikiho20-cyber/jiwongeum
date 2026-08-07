import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의지원금 — 충북·강원 소상공인 지원사업 모음",
  description:
    "충북·강원 지역 소상공인·자영업자 대상 정부·지자체 지원사업 공고를 매일 모아서 지역별로 보여드립니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
