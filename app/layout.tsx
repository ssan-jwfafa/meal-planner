import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: '이유식 식단 추천',
  description: '개월수에 맞춰 AI가 이유식 식단을 추천해주는 앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
