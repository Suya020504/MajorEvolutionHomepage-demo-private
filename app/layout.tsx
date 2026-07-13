import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./devices.css"; // vendored (Devices.css v0.2.0, MIT) — no runtime dep
import { SmoothScroll } from "@/components/site/smooth-scroll";
import localFont from "next/font/local";
import { Preloader } from "@/components/site/preloader";
import { ScrollProgress } from "@/components/site/scroll-progress";

// Self-hosted Pretendard Variable (OFL) — body / UI · 사이트 전역 단일 폰트.
const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  weight: "45 920",
  variable: "--font-pretendard",
  display: "swap",
  preload: true,
});

const SITE_NAME = "모두의 창업 솔루션";
const SITE_DESC =
  "아이디어 하나로 시작하는 창업 제작 솔루션. 제품 시제품부터 웹·앱 MVP까지, 제조(원더플라스틱)와 개발(RC BLOCK)을 함께 설계합니다. 시제품 제작·MVP 개발 기본 150만원부터.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.modusol.kr"),
  title: {
    default: `${SITE_NAME} — 아이디어 하나로 시작하는 창업 제작 솔루션`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "창업 솔루션",
    "시제품 제작",
    "MVP 개발",
    "제품 시제품",
    "웹 개발",
    "앱 개발",
    "3D 모델링",
    "원더플라스틱",
    "RC BLOCK",
    "스타트업 제작",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.modusol.kr",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 아이디어 하나로 시작하는 창업 제작 솔루션`,
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 아이디어 하나로 시작하는 창업 제작 솔루션`,
    description: SITE_DESC,
  },
  verification: {
    // Google Search Console 소유권 확인 (URL 접두어 속성). 삭제 금지 — 제거 시 인증 해제됨.
    google: "BLkx9StAe_g1L-tL5KBZoXM5nVzfw0lPqjMTnIv9txY",
    // 네이버 서치어드바이저 소유권 확인. 삭제 금지 — 제거 시 인증 해제됨.
    other: {
      "naver-site-verification": "845e2511de4032d9fe8ece7cc92e23b1ca20f032",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

const SITE_URL = "https://www.modusol.kr";

// 검색엔진 리치결과용 구조화 데이터. 실제 사업 정보 기준(제조=원더플라스틱, 개발=RC BLOCK).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: "Startup Making Solution",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      image: `${SITE_URL}/opengraph-image.png`,
      email: "dudqls061130@gmail.com",
      description: SITE_DESC,
      slogan: "아이디어 하나로 시작하는 창업 제작 솔루션",
      areaServed: { "@type": "Country", name: "대한민국" },
      knowsAbout: [
        "시제품 제작",
        "제품 디자인",
        "3D 모델링",
        "MVP 개발",
        "웹 개발",
        "앱 개발",
      ],
      subOrganization: [
        { "@type": "Organization", name: "원더플라스틱", description: "제조 기반 시제품 제작" },
        { "@type": "Organization", name: "RC BLOCK", description: "서비스 기반 MVP 개발" },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESC,
      inLanguage: "ko-KR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Service",
      name: "제조 기반 시제품 제작",
      serviceType: "시제품 제작",
      description: "제품 디자인·3D 모델링·시제품 1식 제작. 기본 150만원부터.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@type": "Country", name: "대한민국" },
      offers: {
        "@type": "Offer",
        priceCurrency: "KRW",
        price: "1500000",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "KRW",
          minPrice: "1500000",
        },
        url: `${SITE_URL}/pricing`,
      },
    },
    {
      "@type": "Service",
      name: "서비스 기반 MVP 개발",
      serviceType: "MVP 개발",
      description: "웹·앱 MVP, 핵심 기능, 테스트 결과물. 기본 150만원부터.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@type": "Country", name: "대한민국" },
      offers: {
        "@type": "Offer",
        priceCurrency: "KRW",
        price: "1500000",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "KRW",
          minPrice: "1500000",
        },
        url: `${SITE_URL}/pricing`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={pretendard.variable}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          본문으로 건너뛰기
        </a>
        <SmoothScroll>
          <Preloader />
          {children}
        </SmoothScroll>
        <ScrollProgress />
      </body>
    </html>
  );
}
