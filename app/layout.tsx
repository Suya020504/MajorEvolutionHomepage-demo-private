import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { StoreHydrator } from "@/components/app/store-hydrator";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { brandScene } from "@/lib/brand-assets";
import "./globals.css";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  weight: "45 920",
  variable: "--font-pretendard",
  display: "swap",
  preload: true,
});

const title = "너의 교수님은? - 교수님을 찾고 만들고 잇다";
const description =
  "전공과 진로의 갈림길에서, 공식 근거로 교수님을 찾고 전공을 확장한 아이디어를 만들고 첫 대화부터 다음 만남까지 이어주는 대학생 연구 여정 앱";
const ogImage = brandScene.home.og ?? brandScene.home.w1440;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title,
  description,
  applicationName: "너의 교수님은?",
  appleWebApp: {
    capable: true,
    title: "너의 교수님은?",
    statusBarStyle: "default",
  },
  keywords: ["교수 찾기", "전공 탐색", "연구 아이디어", "면담 준비", "대학생 프로젝트"],
  openGraph: {
    title,
    description,
    locale: "ko_KR",
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5F7FC",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={pretendard.variable} data-scroll-behavior="smooth">
      <body>
        <StoreHydrator />
        <a href="#main-content" className="skip-link">
          본문으로 건너뛰기
        </a>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
