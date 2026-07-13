/**
 * All site copy (original Korean, authored for Axion Studio).
 * Section shapes mirror the wolverineworldwide.com homepage layout,
 * filled with our own web-dev agency content. Images are free Picsum
 * placeholders (swap freely). Single source of truth.
 */

const img = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/**
 * Curated, on-topic Unsplash photos (hand-picked to suit a web-dev studio:
 * code, dashboards, UI, devices, workspace, abstract render). Stable hotlink
 * URLs. Rendered monochrome via `.img-graded` so the whole site stays cohesive.
 * Swap these ids for real project screenshots when available.
 */
const u = (id: string, w = 1600, h = 1100) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&q=80&auto=format&fit=crop`;

export const brand = {
  name: "모두의 창업 솔루션",
  initials: "모두",
  tagline: "아이디어 하나로 시작하는 창업 제작 솔루션",
  // TODO: 실제 도메인/메일로 교체 (기획안: 제조→원더플라스틱, 개발→RC BLOCK·워홀원모어)
  email: "dudqls061130@gmail.com",
  location: "대한민국",
} as const;

// 다중 페이지 IA — 각 항목은 실제 라우트. 문의는 navbar의 CTA 버튼으로 분리.
export const nav = [
  { label: "서비스", href: "/#services" },
  { label: "가격", href: "/pricing" },
  { label: "제작 사례", href: "/work" },
  { label: "회사소개", href: "/about" },
  { label: "제작 과정", href: "/process" },
  { label: "문의", href: "/contact" },
] as const;

export type PricingPlan = {
  tone: "manufacture" | "develop";
  label: string;
  name: string;
  price: string;
  unit: string;
  caption: string;
  features: string[];
  /** Editorial photo — graded monochrome. Swap for real project shots. */
  image: string;
};

export const pricing = {
  kicker: "Pricing",
  title: "투명한 가격,\n명확한 시작점",
  description:
    "시제품 제작도, MVP 개발도 기본 150만원부터. 아이디어와 과업 범위에 따라 제작 방식과 비용이 달라지며, 상담 미팅을 통해 구체적인 견적을 안내드립니다.",
  // Cinematic opener backdrop (paralleluniverse-style blur→focus reveal).
  cinemaImage: u("1454496522488-7a8e488e8606", 2200, 1300), // dramatic peak / horizon
  // Device-mockup screens (rendered inside real iPhone / MacBook frames).
  // Curated, site-valid Unsplash ids — swap for real product screenshots.
  shots: {
    pc: u("1551288049-bebda4e38f71", 1600, 1000), // analytics dashboard
    mobile: u("1512941937669-90a1b58e7e9c", 800, 1600), // mobile app
  },
  plans: [
    {
      tone: "manufacture",
      label: "제조 기반",
      name: "제조 기반 시제품 제작",
      price: "150",
      unit: "만원~",
      caption: "제품 디자인 · 3D 모델링 · 시제품 1식",
      image: "/work/appliance-lineup.jpg", // 원더플라스틱 실제 제작물 (제품 단체컷)
      features: [
        "제품 방향 상담",
        "간단한 제품 디자인",
        "3D 모델링",
        "시제품 1식 제작",
        "기본 후가공",
        "제작 가능성 검토",
      ],
    },
    {
      tone: "develop",
      label: "서비스 기반",
      name: "서비스 기반 MVP 개발",
      price: "150",
      unit: "만원~",
      caption: "웹 / 앱 MVP · 핵심 기능 · 테스트 결과물",
      image: u("1607799279861-4dd421887fb3", 1400, 1000), // web/app dev
      features: [
        "서비스 방향 상담",
        "핵심 기능 정의",
        "기본 웹/앱 MVP 개발",
        "단순 문의 기능",
        "테스트용 결과물 제작",
      ],
    },
  ] as PricingPlan[],
  variables: [
    {
      title: "제품 제작 견적 변수",
      short: "제품 제작",
      desc: "물성·구조·후가공이 단가를 좌우합니다.",
      items: [
        "제품 크기",
        "구조 복잡도",
        "도색 여부",
        "기능 구현",
        "소재 종류",
        "제작 수량",
        "금형 필요 여부",
      ],
    },
    {
      title: "개발 프로젝트 견적 변수",
      short: "개발 프로젝트",
      desc: "범위·연동·운영이 공수를 좌우합니다.",
      items: [
        "페이지 수",
        "기능 수",
        "로그인",
        "관리자 페이지",
        "결제 기능",
        "DB 연동",
        "배포",
        "유지보수",
      ],
    },
  ],
  note: "시제품 제작 150만원부터 · MVP 개발 150만원부터. 기본 금액은 150만원이며, 아이디어와 과업 범위에 따라 제작 방식과 비용이 달라질 수 있습니다. 상담 미팅을 통해 필요한 기능과 제작 범위를 정리한 뒤 구체적인 견적을 안내드립니다.",
  ctaKicker: "Get a Quote",
  ctaTitle: "기본 150만원부터,\n정확한 견적은 미팅에서",
  cta: { label: "견적 상담 신청하기", href: "/contact" },
  ctaAccent: "Transparent from day one.",
  // wibify-style "what's included" rows (square bullets + hairline dividers).
  included: [
    { label: "투명한 견적", desc: "숨은 비용 없이 항목별로 안내합니다." },
    { label: "상담 후 확정", desc: "범위를 정리한 뒤 견적을 드립니다." },
    { label: "제조 + 개발", desc: "한 팀이 통합으로 제작합니다." },
    { label: "유지보수까지", desc: "출시 이후에도 함께합니다." },
  ],
  // 추가 지원 서비스 (기획안 가격 정책) — furoweb 에디토리얼 레이아웃
  supportKicker: "Additional Support",
  supportEyebrow: "추가 지원 서비스",
  // 큰 문장에서 앞부분은 진하게, 뒷부분은 회색으로 사라지는 furoweb 스타일 카피
  supportStatementLead: "제작이 끝이 아니라,",
  supportStatementTail: "창업의 다음 단계까지 함께합니다.",
  support: [
    {
      title: "사업비 서류 · 행정 지원",
      desc: "지원사업 사업비 집행에 필요한 서류 작성과 행정 처리를 지원하며, 세금계산서 발급이 가능합니다.",
      role: "행정 · 서류 지원",
      tag: "서류",
    },
    {
      title: "대면 결제 출장 서비스",
      desc: "모두의 창업 솔루션이 직접 방문해 대면 결제를 진행합니다. 방문 일정 및 지역은 협의를 통해 정합니다.",
      role: "현장 · 대면 지원",
      tag: "협의",
    },
  ],
} as const;

/* ── Partners & MOU (real partners only; logos = swappable wordmarks) ── */
export const partners = {
  kicker: "Partners & MOU",
  title: "함께 만드는\n창업 생태계",
  description:
    "모두의 창업 솔루션은 다양한 기업, 기관, 학교, 지역 네트워크와의 협력을 바탕으로 창업자의 아이디어가 실제 제품과 서비스로 구현될 수 있도록 지원합니다.",
  // central hub of the ecosystem
  hub: {
    name: "모두의 창업 솔루션",
    role: "통합 허브",
    note: "아이디어를 제품·서비스로",
  },
  items: [
    {
      name: "원더플라스틱",
      mark: "WP",
      role: "제조",
      field: "친환경 제조",
      year: "2024",
      note: "폐플라스틱 업사이클 제조",
    },
    {
      name: "RC BLOCK",
      mark: "RC",
      role: "개발",
      field: "웹 · 앱 · MVP 개발",
      year: "2024",
      note: "디지털 서비스 구현",
    },
  ],
  note: "실제 협력 중인 파트너만 노출합니다. 로고와 세부 정보(협력 분야·연도)는 파트너 제공 자료로 교체됩니다.",
} as const;

/* ── 기업 소개 (텍스트는 기획안 그대로) ── */
export const companies = {
  kicker: "Companies",
  title: "모두의 창업 솔루션을\n만드는 팀",
  description: "제조와 개발, 두 역량을 하나의 흐름으로 잇습니다.",
  // Big scroll-revealed manifesto (zetta-joule style), shown right after the
  // "THE MAKERS" cinema. Lines split on \n; words reveal left→right on scroll.
  statement:
    "제조와 개발, 두 역량을 하나의 흐름으로 잇습니다.\n아이디어가 손에 잡히는 제품이 되고\n살아 움직이는 서비스가 될 때까지,\n한 팀이 처음부터 끝까지 함께합니다.",
  // Cinematic intro photo (rotates on scroll). Graded mono — a person-at-work
  // scene best matches the "THE MAKERS" reference. Swap by pasting a direct
  // images.unsplash.com URL.
  cover: u("1521737711867-e3b97375f902", 1400, 1400),
  intro: {
    big: "THE MAKERS",
    left: "BOLDLY\nBUILT",
    right: "INTO ONE\nFLOW",
  },
  members: [
    {
      name: "원더플라스틱",
      role: "제조 기반",
      mark: "WP",
      tags: ["폐플라스틱 수거·분쇄", "친환경 제품 개발", "ESG 굿즈", "체험형 콘텐츠"],
      body: "버려지는 플라스틱에 새로운 가치를 더하는 친환경 업사이클 제조 기업입니다. 폐플라스틱을 수거·세척·분류·분쇄하여 새로운 제품을 제작하며, 친환경 제품 개발과 ESG 굿즈 제작, 체험형 콘텐츠 운영 등을 수행합니다.",
    },
    {
      name: "RC BLOCK",
      role: "개발 기반",
      mark: "RC",
      tags: ["웹 · 앱", "AR · 메타버스", "MVP 개발", "빠른 아이디어 검증"],
      body: "웹, 앱, AR, 메타버스, MVP 개발을 중심으로 창업자의 디지털 서비스 구현을 돕는 개발 기반 솔루션 팀입니다. 초기 창업자가 아이디어를 빠르게 검증할 수 있도록 필요한 기능 중심의 MVP 개발을 지원합니다.",
    },
  ],
  umbrella: {
    name: "모두의 창업 솔루션",
    role: "통합 솔루션",
    mark: "ALL",
    tags: ["제조 + 개발 결합", "통합 제작", "원스톱 지원"],
    body: "원더플라스틱의 제조 역량과 RC BLOCK의 개발 역량을 결합해, 창업자가 제품과 서비스를 보다 쉽게 제작할 수 있도록 지원하는 통합 솔루션입니다.",
  },
} as const;

export type HeroSlide = {
  kicker: string;
  title: string;
  subcopy: string;
  cta: { label: string; href: string };
  image: string;
};

export const heroSlides: HeroSlide[] = [
  {
    kicker: "Web Development Studio",
    title: "야심 찬 브랜드를 위한\n디지털 경험을 설계합니다",
    subcopy:
      "React·Next.js 프론트엔드부터 풀스택 웹 애플리케이션, 정교한 UI/UX 구현까지. 기획서가 아니라 출시 가능한 제품을 전달합니다.",
    cta: { label: "프로젝트 시작하기", href: "/contact" },
    image: img("axion-hero-studio", 2000, 1300),
  },
  {
    kicker: "Frontend Architecture",
    title: "확장 가능한\n프론트엔드 아키텍처",
    subcopy:
      "토큰 기반 디자인 시스템과 재사용 가능한 컴포넌트로, 제품이 커져도 일관성과 속도를 유지합니다.",
    cta: { label: "작업 보기", href: "/work" },
    image: img("axion-hero-architecture", 2000, 1300),
  },
  {
    kicker: "Motion & Interaction",
    title: "기억에 남는\n인터랙션을 만듭니다",
    subcopy:
      "스크롤 기반 모션, 시네마틱 전환, 마이크로 인터랙션. 무겁지 않게, 그러나 인상적으로.",
    cta: { label: "접근 방식 보기", href: "/about" },
    image: img("axion-hero-motion", 2000, 1300),
  },
];

export type CaseStudy = {
  tag: string;
  title: string;
  summary: string;
  stack: string[];
  result: { metric: string; label: string }[];
  image: string;
};

export const caseStudies: CaseStudy[] = [
  {
    tag: "Corporate",
    title: "글로벌 제조 기업 브랜드 사이트",
    summary:
      "노후한 기업 사이트를 스크롤 기반 스토리텔링과 다국어 CMS로 재정의해 브랜드 톤을 격상시켰습니다.",
    stack: ["Next.js", "TypeScript", "Framer Motion", "Headless CMS"],
    result: [
      { metric: "+182%", label: "체류 시간" },
      { metric: "98", label: "Lighthouse 성능" },
    ],
    image: u("1555066931-4365d14bab8c", 1200, 1600),
  },
  {
    tag: "SaaS",
    title: "B2B 분석 SaaS 대시보드",
    summary:
      "가상화 테이블과 차트 컴포넌트, 토큰 기반 디자인 시스템으로 확장 가능한 실시간 분석 UI를 구축했습니다.",
    stack: ["React", "TanStack", "Recharts", "Tailwind CSS"],
    result: [
      { metric: "-63%", label: "초기 로드" },
      { metric: "x3", label: "지표 확장 속도" },
    ],
    image: u("1560472354-b33ff0c44a43", 1200, 1600),
  },
  {
    tag: "AI Startup",
    title: "AI 스타트업 제품 플랫폼",
    summary:
      "스트리밍 응답 UI와 인터랙티브 데모, 명확한 온보딩을 갖춘 풀스택 플랫폼을 6주 만에 출시했습니다.",
    stack: ["Next.js", "FastAPI", "Supabase", "Vercel"],
    result: [
      { metric: "6주", label: "MVP 출시" },
      { metric: "+41%", label: "가입 전환" },
    ],
    image: u("1710438399422-2fca27686bcd", 1200, 1600),
  },
  {
    tag: "Public Data",
    title: "공공 데이터 개방 플랫폼",
    summary:
      "서버 컴포넌트 기반 검색과 키보드 완전 지원, 접근성 최우선으로 누구나 쓰는 데이터 포털을 만들었습니다.",
    stack: ["Next.js", "PostgreSQL", "Node.js", "AWS"],
    result: [
      { metric: "WCAG AA", label: "접근성 준수" },
      { metric: "120만+", label: "월 조회수" },
    ],
    image: u("1526628953301-3e589a6a8b74", 1200, 1600),
  },
  {
    tag: "Mobile-first",
    title: "모바일 퍼스트 커머스 웹앱",
    summary:
      "PWA와 낙관적 UI, 제스처 인터랙션으로 설치 없이도 네이티브에 가까운 모바일 쇼핑 경험을 구현했습니다.",
    stack: ["Next.js", "PWA", "Zustand", "Stripe"],
    result: [
      { metric: "+57%", label: "모바일 전환" },
      { metric: "1.2s", label: "LCP" },
    ],
    image: u("1581287053822-fd7bf4f4bfec", 1200, 1600),
  },
];

export const approach = {
  kicker: "Our Approach",
  title: "기획이 아니라,\n출시 가능한 제품을 만듭니다",
  body: "디스커버리부터 유지보수까지 한 팀이 책임집니다. 투명한 단계와 명확한 산출물로 일정을 예측 가능하게 만들고, 성능과 접근성을 기준으로 처음부터 견고하게 설계합니다.",
  cta: { label: "함께 일하기", href: "/contact" },
  image: u("1631624215749-b10b3dd7bca7", 1300, 1700),
  steps: [
    "디스커버리 & 전략",
    "UX 구조 설계",
    "디자인 시스템",
    "프론트엔드 개발",
    "백엔드 · API 연동",
    "QA · 배포 · 유지보수",
  ],
};

export const stats = [
  { value: "150만원~", label: "기본 제작 단가 (시제품·MVP)" },
  { value: "6단계", label: "투명한 제작 프로세스" },
  { value: "3사", label: "협력 파트너 · 원더플라스틱·RC BLOCK·워홀원모어" },
  { value: "15+", label: "제조·개발 제작 가능 항목" },
] as const;

/**
 * 제작 프로세스 (별도 페이지 /process).
 * 기획안의 "6단계 투명한 제작 프로세스"를 제조·개발 통합 흐름으로 구성.
 */
export const processPage = {
  hero: {
    kicker: "Making Process",
    title: "아이디어에서\n출시까지, 한 흐름으로",
    accent: "From idea to launch.",
    body:
      "제조와 개발을 함께 이해하는 한 팀이 6단계로 책임집니다. 각 단계의 산출물과 일정을 투명하게 공유해, 처음 창업하는 분도 끝까지 예측 가능하게 만듭니다.",
    meta: ["6단계 제작 프로세스", "제조 · 개발 통합", "단계별 산출물 제공"],
  },
  steps: [
    {
      no: "01",
      track: "고객",
      title: "문의 접수",
      lead: "원하는 걸 간단히 남기세요",
      body:
        "홈페이지 문의폼을 통해 제작하고 싶은 내용을 간단히 작성합니다. 제조·개발 중 어떤 것인지만 골라주셔도 됩니다.",
      deliverables: ["문의폼 작성", "제조 / 개발 선택"],
      image: u("1454165804606-c3d57bc86b40", 1300, 1700),
    },
    {
      no: "02",
      track: "담당자",
      title: "사전 검토",
      lead: "가능성부터 확인합니다",
      body:
        "제조 또는 개발 담당자가 문의 내용을 확인하고 제작 가능성을 검토합니다.",
      deliverables: ["담당자 배정", "제작 가능성 검토"],
      image: u("1581091226825-a6a2a5aee158", 1300, 1700),
    },
    {
      no: "03",
      track: "공통",
      title: "미팅 진행",
      lead: "범위를 함께 정의합니다",
      body:
        "온·오프라인 미팅으로 과업 범위, 제작 목적, 일정, 예산을 논의합니다.",
      deliverables: ["온 · 오프라인 미팅", "범위 · 일정 · 예산 논의"],
      image: "/services/uiux.jpg", // 팀 미팅 · 화이트보드 논의
    },
    {
      no: "04",
      track: "운영",
      title: "견적 산정",
      lead: "투명한 견적서로",
      body:
        "미팅 내용을 바탕으로 세부 견적서를 작성합니다. 항목별 비용을 명확히 안내합니다.",
      deliverables: ["세부 견적서", "항목별 비용 안내"],
      image: u("1554224155-6726b3ff858f", 1300, 1700), // 계산기 · 서류
    },
    {
      no: "05",
      track: "제조 · 개발",
      title: "계약 및 착수",
      lead: "제작을 시작합니다",
      body:
        "계약 후 디자인, 설계, 개발 또는 제작 작업을 시작합니다.",
      deliverables: ["계약 체결", "작업 착수"],
      image: u("1450101499163-c8848c66ca85", 1300, 1700), // 계약서 서명
    },
    {
      no: "06",
      track: "제조 · 개발",
      title: "결과물 납품",
      lead: "끝까지 책임집니다",
      body:
        "시제품, MVP, 웹사이트, 앱, AR 콘텐츠 등 결과물을 납품합니다.",
      deliverables: ["결과물 납품", "후속 지원"],
      image: "/work/appliance-lineup.jpg", // 실제 완성 제품 단체컷
    },
  ],
  cta: {
    kicker: "Start your project",
    title: "어느 단계든, 지금 시작할 수 있습니다",
    body: "아이디어만 있어도 1단계부터, 시제품이 있다면 그다음 단계부터. 편하게 문의해 주세요.",
    label: "제작 문의하기",
    href: "/contact",
  },
} as const;

/**
 * 문의 페이지 (별도 페이지 /contact).
 * 제조/개발 2트랙 문의폼. 제출은 mailto 기반(백엔드 무연동) — 추후 Formspree/
 * 서버리스로 교체 가능.
 */
export const contactPage = {
  hero: {
    kicker: "Contact",
    title: "어떤 아이디어든,\n편하게 들려주세요",
    accent: "Let's build it together.",
    body:
      "제조든 개발이든, 아직 정리되지 않은 생각이어도 괜찮습니다. 보내주시면 영업일 기준 1~2일 안에 답변드립니다.",
  },
  tracks: [
    { id: "manufacture", label: "제조 기반", desc: "시제품 · 목업 · 양산" },
    { id: "develop", label: "서비스 기반", desc: "웹 · 앱 · MVP 개발" },
    { id: "both", label: "아직 모르겠어요", desc: "상담하며 함께 정할게요" },
  ],
  budgets: ["150만 ~ 500만원", "500만 ~ 1,000만원", "1,000만원 이상", "미정 · 상담 후 결정"],
  // 개발 트랙 서비스 선택지 (기획안: 웹/앱/AR/메타버스)
  devServices: ["웹", "앱", "AR", "메타버스"],
  // 담당 메일 라우팅 — 제출은 백엔드 없이 mailto 로 열리며, 아래 주소가 그대로 수신인이 됩니다.
  //   제조 문의 → 원더플라스틱 / 개발 문의·미정("아직 모르겠어요") → 연빈(개발 담당)
  recipients: {
    manufacture: "wonderplastic@naver.com",
    develop: "dudqls061130@gmail.com",
    both: "dudqls061130@gmail.com",
  } as Record<string, string>,
  aside: {
    items: [
      { label: "이메일", value: brand.email },
      { label: "응답 시간", value: "영업일 1~2일 이내" },
      { label: "위치", value: brand.location },
    ],
    note: "먼저 제작 흐름이 궁금하다면",
    noteLink: { label: "6단계 제작 과정 보기", href: "/process" },
  },
} as const;

/* ── AI 상담 (문의 페이지 상단, OpenAI 기반 대화) ── */
export const aiAssistant = {
  kicker: "AI Concierge",
  title: "아이디어를\n먼저 들려주세요",
  accent: "Ask anything, anytime.",
  description:
    "제작 가능성·예상 비용·진행 방식이 궁금하다면 AI 상담원에게 먼저 편하게 물어보세요. 제조와 개발 어느 쪽이 맞을지 함께 정리해 드립니다.",
  greeting:
    "안녕하세요, 모두의 창업 솔루션 AI 상담원입니다. 만들고 싶은 제품이나 서비스 아이디어를 들려주시면, 제조·개발 중 어떤 방식이 맞을지와 대략적인 진행 방향을 함께 정리해 드릴게요.",
  suggestions: [
    "시제품 제작은 비용이 얼마나 드나요?",
    "앱 MVP 개발 기간은 얼마나 걸려요?",
    "제 아이디어, 제작이 가능한지 봐줄 수 있나요?",
    "제조와 개발 중 뭐가 맞을지 모르겠어요",
  ],
  placeholder: "메시지를 입력하세요…",
  disclaimer:
    "AI 상담은 참고용 안내입니다. 정확한 견적·일정·계약은 아래 문의 폼으로 남겨주시면 담당자가 안내드립니다.",
  formCue: "정식 문의 남기기",
  errorMessage:
    "지금은 AI 상담 연결이 어려워요. 잠시 후 다시 시도하시거나, 아래 문의 폼으로 남겨주시면 담당자가 직접 안내드리겠습니다.",
} as const;

export type NewsItem = {
  category: string;
  date: string;
  title: string;
  image: string;
};

export const news: NewsItem[] = [
  {
    category: "Engineering",
    date: "2026.05",
    title: "Core Web Vitals를 기준으로 한 프론트엔드 성능 최적화 실전",
    image: img("axion-news-perf", 1200, 900),
  },
  {
    category: "Design System",
    date: "2026.04",
    title: "디자인 시스템을 처음부터 설계하는 6가지 원칙",
    image: img("axion-news-ds", 1200, 900),
  },
  {
    category: "Case Study",
    date: "2026.03",
    title: "6주 만에 AI 스타트업 플랫폼을 출시한 방법",
    image: img("axion-news-ai", 1200, 900),
  },
  {
    category: "Motion",
    date: "2026.02",
    title: "무겁지 않게, 인상적으로: 스크롤 모션 설계 가이드",
    image: img("axion-news-motion", 1200, 900),
  },
  {
    category: "Accessibility",
    date: "2026.01",
    title: "WCAG AA를 기본값으로 만드는 컴포넌트 설계",
    image: img("axion-news-a11y", 1200, 900),
  },
  {
    category: "Culture",
    date: "2025.12",
    title: "원격 우선 스튜디오의 협업과 커뮤니케이션",
    image: img("axion-news-culture", 1200, 900),
  },
];

export type Service = {
  no: string;
  label: string;
  name: string;
  description: string;
  cta: string;
  image: string;
};

/** Big text that stays centered while services cycle (digitalists-style). */
export const servicesShowcase = {
  kicker: "Services",
  centerValue: "120+",
  centerLabel: "프로젝트",
  rightKicker: "What we build",
};

export const services: Service[] = [
  {
    no: "01",
    label: "Frontend",
    name: "프론트엔드 개발",
    description:
      "React·Next.js로 빠르고 SEO에 강하며 유지보수하기 쉬운 모던 프론트엔드를 구축합니다. App Router와 RSC를 활용한 최신 아키텍처.",
    cta: "프론트엔드 개발 더 보기",
    image: "/services/frontend.jpg",
  },
  {
    no: "02",
    label: "Full-stack",
    name: "풀스택 웹 애플리케이션",
    description:
      "인증·결제·실시간·대시보드까지, 프론트와 백엔드를 하나의 흐름으로 설계해 제품 전체를 완성합니다.",
    cta: "풀스택 개발 더 보기",
    image: u("1607799279861-4dd421887fb3", 1200, 1500),
  },
  {
    no: "03",
    label: "UI/UX",
    name: "UI/UX 구현",
    description:
      "Figma 시안을 픽셀 단위로 옮기는 것을 넘어, 인터랙션과 상태까지 의도대로 동작하는 인터페이스로 구현합니다.",
    cta: "UI/UX 구현 더 보기",
    image: "/services/uiux.jpg",
  },
  {
    no: "04",
    label: "Design System",
    name: "디자인 시스템",
    description:
      "토큰 기반 디자인 시스템과 재사용 가능한 컴포넌트 아키텍처로, 제품이 커져도 일관성과 속도를 유지합니다.",
    cta: "디자인 시스템 더 보기",
    image: "/services/design-system.jpg",
  },
  {
    no: "05",
    label: "Motion & 3D",
    name: "애니메이션 · 3D 인터랙션",
    description:
      "스크롤 기반 모션, 시네마틱 전환, 3D 인터랙션. 무겁지 않게, 그러나 기억에 남도록 설계합니다.",
    cta: "인터랙션 더 보기",
    image: "/services/motion-3d.jpg",
  },
  {
    no: "06",
    label: "Performance",
    name: "성능 최적화 · 반응형",
    description:
      "Core Web Vitals를 기준으로 번들·이미지·렌더링을 튜닝합니다. 모든 디바이스에서 빠르고 매끄럽게.",
    cta: "성능 최적화 더 보기",
    image: u("1551288049-bebda4e38f71", 1200, 1500),
  },
];

/* ── 제작 사례 (기획안 5-4): 제조 / 개발 제작 가능 결과물 갤러리 ── */
export const workGallery = {
  kicker: "Work",
  title: "제조부터 개발까지,\n만들 수 있는 것들",
  description:
    "원더플라스틱과 함께한 실제 제조 사례, 그리고 웹·앱·AI·공간분석까지 직접 만든 개발 프로젝트입니다.",
  filters: [
    { key: "all", label: "전체" },
    { key: "manufacture", label: "제조 사례" },
    { key: "develop", label: "개발 사례" },
  ],
  items: [
    // 제조 — 원더플라스틱 실제 제작 사례 (/public/work)
    { name: "쉐보레 TRAX 차량 미니어처", track: "manufacture", image: "/work/trax.jpg" },
    { name: "스팟에어컨 미니어처", track: "manufacture", image: "/work/spot-ac.jpg" },
    { name: "가전 미니어처 세트", track: "manufacture", image: "/work/appliance-lineup.jpg" },
    { name: "보트 미니어처 · 3D모델", track: "manufacture", image: "/work/boat.jpg" },
    { name: "제주 관광 굿즈", track: "manufacture", image: "/work/jeju-goods.jpg" },
    { name: "JR YOUTH 키링", track: "manufacture", image: "/work/jr-keyring.jpg" },
    { name: "행사 네임택 · 판촉물", track: "manufacture", image: "/work/event-goods.jpg" },
    { name: "캐릭터 굿즈", track: "manufacture", image: "/work/character-goods.jpg" },
    { name: "UC-RISE 시상패", track: "manufacture", image: "/work/award.jpg" },
    { name: "무드등 · 생활소품", track: "manufacture", image: "/work/moodlamp.jpg" },
    { name: "무지개 휴대폰 거치대", track: "manufacture", image: "/work/phone-stand.jpg" },
    { name: "발전기 · 모터 실험 리그", track: "manufacture", image: "/work/generator-rig.jpg" },
    // 개발 — 실제 프로젝트 사례 (/public/work)
    { name: "영주선비길", desc: "AI 여행 설계 · GraphRAG 추천 경로", track: "develop", image: "/work/proj-seonbi.webp" },
    { name: "다타버스 (DATA-BUS)", desc: "교통 사각지대 진단 · DRT 시뮬레이션", track: "develop", image: "/work/proj-databus.webp" },
    { name: "NoriGo", desc: "관광 데이터 관제 대시보드", track: "develop", image: "/work/proj-norigo.webp" },
    { name: "CULTURE TWIN", desc: "문화예술교육 공급 사각지대 디지털 트윈", track: "develop", image: "/work/proj-culturetwin.webp" },
    { name: "태양광 시뮬레이터", desc: "옥상 태양광 발전량·요금절감 분석", track: "develop", image: "/work/proj-solar.webp" },
    { name: "VentureTwin AI", desc: "AI 아이디어 코칭 SaaS", track: "develop", image: "/work/proj-venturetwin.webp" },
    { name: "맞춤형 건강 관리 앱", desc: "여성 건강 · 개인 맞춤 케어", track: "develop", image: "/work/proj-health.webp" },
    { name: "로컬 여행 · AR 컬처 스캔", desc: "숨은 명소 추천 + 실물 인식 가이드", track: "develop", image: "/work/proj-localtravel.webp" },
    { name: "모두의 창업 솔루션", desc: "본 웹사이트 · 랜딩·문의·관리자 일체 제작", track: "develop", image: "/work/proj-landing.webp" },
  ],
} as const;

/* ── 장비 및 기술 역량 (기획안 5-5): 제조 장비 / 개발 기술 스택 ── */
export const capabilities = {
  kicker: "Capabilities",
  title: "도구가\n결과를 만듭니다",
  description:
    "제조 장비부터 개발 기술 스택까지 — 아이디어를 실제 제품과 서비스로 구현하는 역량입니다.",
  groups: [
    // 제조 장비: 원더플라스틱 실제 작업·제작물 사진(/public/work).
    //    장비 실사(사출기·도색부스 등)가 준비되면 image 값만 교체하세요.
    // 개발 기술: 큐레이션 스톡(u) — 주제 고정, 랜덤 아님. (모노톤 자동 적용)
    {
      key: "hardware" as const,
      eyebrow: "Hardware",
      label: "제조 장비",
      items: [
        { name: "3D프린터", desc: "시제품 · 목업 출력", image: "/work/printing-process.jpg" },
        { name: "소형 사출기", desc: "양산 전 사출 테스트", image: "/work/machine-parts.jpg" },
        { name: "분쇄기", desc: "폐플라스틱 분쇄 · 재료화", image: "/work/bottle-keyring.jpg" },
        { name: "후가공 장비", desc: "샌딩 · 조립 · 마감", image: "/work/vase.jpg" },
        { name: "도색 장비", desc: "표면 도색 · 컬러 마감", image: "/work/tumbler.jpg" },
        { name: "모델링 장비", desc: "3D 형상 · 구조 설계", image: "/work/boat-3d.jpg" },
        { name: "시제품 제작 장비", desc: "소량 · 전시용 제작", image: "/work/generator-rig.jpg" },
        { name: "제품 촬영 장비", desc: "제품 · 콘텐츠 촬영", image: "/work/appliance-lineup.jpg" },
      ],
    },
    {
      key: "stack" as const,
      eyebrow: "Stack",
      label: "개발 기술",
      items: [
        { name: "Web", desc: "기업 홈페이지 · 웹앱", image: u("1551288049-bebda4e38f71", 800, 600) },
        { name: "App", desc: "iOS · Android 앱", image: u("1512941937669-90a1b58e7e9c", 800, 600) },
        { name: "React", desc: "컴포넌트 기반 UI", image: "/stack/react.avif" },
        { name: "Next.js", desc: "SSR · 풀스택 웹", image: "/stack/nextjs.webp" },
        { name: "Flutter", desc: "크로스플랫폼 앱", image: "/stack/flutter.webp" },
        { name: "AI API 연동", desc: "챗봇 · 추천 · 자동화", image: "/stack/ai.jpg" },
        { name: "데이터 분석", desc: "수집 · 시각화 · 인사이트", image: "/services/data.jpg" },
        { name: "백엔드 · API 구축", desc: "서버 · DB · API 설계", image: "/services/backend.jpg" },
      ],
    },
  ],
} as const;

export const cultureCta = {
  kicker: "Start a Project",
  title: "아이디어만 있어도\n괜찮습니다",
  body: "제작 가능성부터 함께 검토해드립니다. 제조 또는 개발 문의를 남겨주시면 담당자가 확인 후 미팅을 거쳐 구체적인 견적을 안내드립니다.",
  cta: { label: "제작 문의하기", href: "/contact" },
  image: img("modu-culture", 2000, 1200),
};

export const footer = {
  description:
    "아이디어 하나로 시작하는 창업 제작 솔루션. 제품 시제품부터 웹·앱 MVP까지, 제조와 개발을 함께 설계합니다.",
  groups: [
    {
      title: "바로가기",
      links: [
        { label: "서비스", href: "/#services" },
        { label: "가격", href: "/pricing" },
        { label: "제작 사례", href: "/work" },
        { label: "회사소개", href: "/about" },
        { label: "문의", href: "/contact" },
      ],
    },
    {
      title: "서비스",
      links: [
        { label: "제조 기반 솔루션", href: "/#services" },
        { label: "서비스 기반 솔루션", href: "/#services" },
        { label: "시제품 제작", href: "/pricing" },
        { label: "웹·앱 MVP 개발", href: "/pricing" },
      ],
    },
  ],
  social: [
    { label: "GitHub", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Instagram", href: "#" },
  ],
  legal: [{ label: "개인정보처리방침", href: "/privacy" }],
};

/* ── 개인정보처리방침 (기획안 포함 기능) — 표준 초안, 법적 검토 후 교체 ── */
export const privacy = {
  title: "개인정보처리방침",
  updated: "2026.06.29",
  intro:
    "모두의 창업 솔루션(이하 '회사')은 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 홈페이지의 문의 기능과 관련하여 수집하는 개인정보의 처리에 관한 사항을 안내합니다.",
  sections: [
    {
      h: "1. 수집하는 개인정보 항목",
      body:
        "문의 접수 과정에서 다음 항목을 수집합니다. (필수) 이름, 이메일 / (선택) 연락처, 회사명, 제작 제품·개발 서비스, 예상 수량·필요 기능, 희망 일정, 예산 범위, 참고자료, 문의 내용.",
    },
    {
      h: "2. 수집 및 이용 목적",
      body:
        "수집한 개인정보는 문의 응대, 제작 가능성 검토, 견적 안내 및 상담 진행을 위해서만 이용합니다.",
    },
    {
      h: "3. 보유 및 이용 기간",
      body:
        "문의 처리 완료 후 보존 필요가 없는 경우 지체 없이 파기합니다. 상담이 계약으로 이어진 경우 관계 법령이 정한 기간 동안 보관할 수 있습니다.",
    },
    {
      h: "4. 제3자 제공",
      body:
        "회사는 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 제작 진행에 필요한 경우 협력사(원더플라스틱·RC BLOCK·워홀원모어)와 이용자의 동의를 받아 최소한의 범위에서 공유할 수 있습니다.",
    },
    {
      h: "5. 이용자의 권리",
      body:
        "이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있으며, 아래 연락처로 요청하실 수 있습니다.",
    },
    { h: "6. 문의처", body: brand.email },
  ],
  notice:
    "※ 본 방침은 표준 양식 기반의 초안입니다. 실제 운영 정책과 법적 검토를 거쳐 확정·교체해 주세요.",
} as const;
