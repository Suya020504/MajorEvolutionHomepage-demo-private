export type ServiceSection =
  | "/home"
  | "/professors"
  | "/quest"
  | "/research"
  | "/project-professors"
  | "/portfolio"
  | "/profile";

export type ServiceJourneyKey = "professor" | "project";

export type ServiceJourney = {
  key: ServiceJourneyKey;
  label: string;
  step: 1 | 2;
};

export type ServiceHelpStep = {
  title: string;
  description: string;
};

export type ServiceHelpArea = {
  title: string;
  description: string;
  selector: string;
};

export type ServiceHelpCopy = {
  section: ServiceSection;
  label: string;
  title: string;
  purpose: string;
  now: string;
  next: string;
  steps: readonly ServiceHelpStep[];
  areas: readonly ServiceHelpArea[];
};

type SearchParamsLike = {
  get: (name: string) => string | null;
};

export const SERVICE_NAV_GUIDE_STORAGE_KEY = "major-evolution-service-nav-guide-v3";
export const SERVICE_MOBILE_NAV_GUIDE_STORAGE_KEY = "major-evolution-service-nav-guide-mobile-v4";
export const SERVICE_DESKTOP_NAV_GUIDE_STORAGE_KEY = "major-evolution-service-nav-guide-desktop-v2";
export const SERVICE_NAV_GUIDE_EVENT = "major-evolution:open-navigation-guide";
export const SERVICE_HOME_ONBOARDING_EVENT = "major-evolution:open-home-onboarding";
export const SERVICE_NAV_GUIDE_QUERY_PARAM = "guide";
export const SERVICE_NAV_GUIDE_QUERY_VALUE = "tabs";
export const SERVICE_HOME_WITH_NAV_GUIDE = "/home?guide=tabs";
export const SERVICE_HELP_AUTO_OPEN_STORAGE_PREFIX = "major-evolution-service-help-seen-v2";

export function resolveServiceHelpAutoSection(
  pathname: string,
  searchParams?: SearchParamsLike,
): Exclude<ServiceSection, "/profile"> | null {
  if (pathname === "/home") {
    if (searchParams?.get("professor") === "quick") return "/professors";
    if (searchParams?.get("project") === "quick") return "/research";
    return "/home";
  }
  if (pathname === "/professors") return "/professors";
  if (pathname === "/quest") return "/quest";
  if (pathname === "/research") return "/research";
  if (pathname === "/project-professors") return "/project-professors";
  if (pathname === "/portfolio") return "/portfolio";
  return null;
}

export function getServiceHelpAutoOpenStorageKey(
  pathname: string,
  searchParams?: SearchParamsLike,
) {
  const section = resolveServiceHelpAutoSection(pathname, searchParams);
  if (!section) return null;
  return `${SERVICE_HELP_AUTO_OPEN_STORAGE_PREFIX}:${section.slice(1)}`;
}

export function shouldOpenServiceNavGuide({
  matchingViewport,
  requested,
  hasCompletedGuide,
  isPlainHome,
}: {
  matchingViewport: boolean;
  requested: boolean;
  hasCompletedGuide: boolean;
  isPlainHome: boolean;
}) {
  return matchingViewport && (requested || (isPlainHome && !hasCompletedGuide));
}

export const SERVICE_GUIDE_STEPS = [
  {
    section: "/home" as const,
    label: "홈",
    title: "오늘의 다음 행동을 먼저 확인해요",
    description: "교수 연결, 프로젝트, 성장 기록 중 지금 이어갈 한 가지를 먼저 보여줘요.",
    anchor: "8.333%",
  },
  {
    section: "/professors" as const,
    label: "교수 매칭",
    title: "내 고민에서 첫 교수님을 찾아요",
    description: "고민을 정리한 뒤 학교 공식 정보를 근거로 대화할 교수님을 찾아요.",
    anchor: "25%",
  },
  {
    section: "/quest" as const,
    label: "교수 만남 준비",
    title: "선택한 교수님과의 첫 대화를 준비해요",
    description: "첫 질문과 이메일부터 면담 후 기록까지 교수 매칭 다음 단계를 이어가요.",
    anchor: "41.667%",
  },
  {
    section: "/research" as const,
    label: "AI 프로젝트 설계",
    title: "관심사를 실행할 프로젝트로 만들어요",
    description: "AI와 질문을 주고받으며 수업, 프로젝트, 연구 아이디어를 구체화해요.",
    anchor: "58.333%",
  },
  {
    section: "/project-professors" as const,
    label: "맞춤 교수 추천",
    title: "프로젝트에 필요한 교수님을 연결해요",
    description: "설계한 주제와 방법을 기준으로 프로젝트 실행에 어울리는 교수님을 찾아요.",
    anchor: "75%",
  },
  {
    section: "/portfolio" as const,
    label: "나의 성장과정",
    title: "지금까지의 변화를 기록으로 남겨요",
    description: "교수 연결, 프로젝트, AI 교수님과 나눈 생각을 나만의 성장 흐름으로 모아요.",
    anchor: "91.667%",
  },
] as const;

export function navigationJourney(section: string): ServiceJourney | null {
  if (section === "/professors") return { key: "professor", label: "교수 연결", step: 1 };
  if (section === "/quest") return { key: "professor", label: "교수 연결", step: 2 };
  if (section === "/research") return { key: "project", label: "프로젝트 실행", step: 1 };
  if (section === "/project-professors") return { key: "project", label: "프로젝트 실행", step: 2 };
  return null;
}

export function resolveServiceSection(
  pathname: string,
  searchParams?: SearchParamsLike,
): ServiceSection | null {
  if (pathname === "/home" && searchParams?.get("professor") === "quick") return "/professors";
  if (pathname === "/home" && searchParams?.get("project") === "quick") return "/research";

  if (pathname.startsWith("/project-professors")) return "/project-professors";

  if (pathname === "/tutorial" || pathname.startsWith("/professors")) {
    return searchParams?.get("from") === "project" ? "/project-professors" : "/professors";
  }

  if (
    pathname.startsWith("/quest")
    || pathname.startsWith("/paper")
    || pathname.startsWith("/mentor-loop")
  ) return "/quest";

  if (
    pathname.startsWith("/research")
    || pathname.startsWith("/co-design")
    || pathname.startsWith("/result")
  ) {
    return searchParams?.get("section") === "professor-connection"
      ? "/project-professors"
      : "/research";
  }

  if (pathname.startsWith("/portfolio")) return "/portfolio";
  if (pathname.startsWith("/profile")) return "/profile";
  if (pathname === "/home" || pathname.startsWith("/mentoring")) return "/home";
  return null;
}

const SECTION_HELP: Record<Exclude<ServiceSection, "/profile">, ServiceHelpCopy> = {
  "/home": {
    section: "/home",
    label: "홈",
    title: "지금 이어갈 한 가지를 먼저 보여줘요",
    purpose: "교수 연결, 프로젝트, 성장 기록의 현재 상태를 한곳에서 확인하는 화면이에요.",
    now: "가장 위의 행동 카드에서 지금 필요한 다음 단계를 시작해 보세요.",
    next: "완료한 내용은 나의 성장과정에 차곡차곡 이어져요.",
    steps: [
      { title: "오늘 할 일 시작", description: "맨 위 ‘지금 할 일’을 눌러 오늘 이어갈 한 가지를 시작해요." },
      { title: "현재 상태 확인", description: "선택한 교수와 첫 대화 준비 진행률에서 지금 단계를 확인해요." },
      { title: "기록 이어보기", description: "완료한 내용은 최근 기록이나 나의 성장과정에서 다시 봐요." },
    ],
    areas: [
      { title: "오늘의 핵심 행동", description: "가장 먼저 이어갈 일과 시작 버튼을 한 카드에 모았어요.", selector: '[data-service-help="home-next-action"]' },
      { title: "나의 첫 교수 연결", description: "선택한 교수와 공식 정보, 다른 교수를 확인하는 버튼이 있는 영역이에요.", selector: '[data-service-help="home-professor"]' },
      { title: "첫 대화 준비 진행률", description: "완료한 단계와 지금 이어갈 단계를 확인하고 바로 이동할 수 있어요.", selector: '[data-service-help="home-progress"]' },
    ],
  },
  "/professors": {
    section: "/professors",
    label: "교수 연결 1/2",
    title: "내 고민과 이어지는 교수님을 찾아요",
    purpose: "전공과 관심 분야를 설정하고 학교 공식 정보에서 대화할 교수님을 찾는 곳이에요.",
    now: "처음이라면 기본 설정을 마친 뒤, 후보 교수의 연결 근거를 비교해 보세요.",
    next: "한 분을 고르면 교수 만남 준비로 이어져요.",
    steps: [
      { title: "전공 설정", description: "학교와 단과대, 현재 공부하는 전공을 설정해요." },
      { title: "관심 분야 선택", description: "공식 연구 분야와 비교할 관심사를 하나 이상 골라요." },
      { title: "교수 선택하기", description: "세 교수의 연결 이유와 공식 근거를 비교하고 한 분을 선택해요." },
    ],
    areas: [
      { title: "기본 설정 진행 단계", description: "전공과 관심 분야 중 어디까지 설정했는지 보여줘요.", selector: '[data-service-help="professor-progress-context"]' },
      { title: "현재 설정 항목", description: "교수 연결에 필요한 최소 정보만 입력하거나 선택하는 영역이에요.", selector: '[data-service-help="professor-question"], [data-service-help="professor-options"]' },
      { title: "이전·다음 행동", description: "설정을 수정하거나 확인하고 교수 매칭으로 이동하는 버튼이에요.", selector: '[data-service-help="professor-actions"]' },
    ],
  },
  "/quest": {
    section: "/quest",
    label: "교수 연결 2/2",
    title: "교수님과의 첫 만남을 준비해요",
    purpose: "교수를 선택한 뒤 연락 전부터 면담 후까지 필요한 준비를 이어가는 곳이에요.",
    now: "화면 위의 다음 행동을 따라 논문 한입, 첫 질문, 이메일을 한 단계씩 준비해 보세요.",
    next: "면담 뒤 얻은 조언과 행동은 나의 성장과정에 남길 수 있어요.",
    steps: [
      { title: "연결 교수 확인", description: "대화할 교수님과 공식 연구 근거를 먼저 확인해요." },
      { title: "만나기 전 준비", description: "논문 한입, 첫 질문, 이메일 순서로 준비를 채워요." },
      { title: "대화와 후속 기록", description: "대비 질문을 준비하고 만난 뒤 조언을 다음 행동으로 기록해요." },
    ],
    areas: [
      { title: "지금 할 준비", description: "현재 단계에서 가장 먼저 할 일과 시작 버튼을 보여주는 핵심 카드예요.", selector: 'section[aria-labelledby="hub-primary-task"]' },
      { title: "첫 만남 여정", description: "교수 선택부터 면담 후 기록까지 네 단계의 현재 상태를 확인해요.", selector: 'section[aria-labelledby="meeting-journey-title"]' },
      { title: "교수·준비 현황", description: "연결한 교수의 근거와 지금까지 저장한 준비물을 함께 확인해요.", selector: 'aside[aria-label="현재 교수 연결과 저장한 준비 현황"]' },
    ],
  },
  "/research": {
    section: "/research",
    label: "프로젝트 실행 1/2",
    title: "관심사를 실행할 프로젝트로 구체화해요",
    purpose: "전공, 관심사, 실행 조건을 AI와 정리해 비교할 프로젝트 후보를 만드는 곳이에요.",
    now: "탐색 방식을 고르고 한 번에 한 질문씩 답해 보세요.",
    next: "프로젝트를 고르면 실행에 필요한 맞춤 교수 추천으로 이어져요.",
    steps: [
      { title: "입력 방식 선택", description: "한 단계씩 질문받기 또는 한 화면에서 직접 입력을 선택해요." },
      { title: "조건과 질문 정리", description: "전공·관심·경험·기간을 확인하고 공통 3개와 맞춤 2개 질문에 답해요." },
      { title: "후보 비교·선택", description: "프로젝트 후보 2개의 근거를 비교해 실행할 하나를 골라요." },
    ],
    areas: [
      { title: "프로젝트 준비 진행률", description: "전공부터 최종 확인까지 어느 단계에 있는지 보여줘요.", selector: '[data-service-help="research-progress"]' },
      { title: "현재 질문과 입력", description: "프로젝트 조건을 한 가지씩 선택하거나 입력하는 중심 영역이에요.", selector: '[data-service-help="research-question"]' },
      { title: "이전·다음 행동", description: "답을 보류하거나 이전·다음 질문으로 이동하는 버튼 영역이에요.", selector: '[data-service-help="research-actions"], [data-service-help="research-context"]' },
    ],
  },
  "/project-professors": {
    section: "/project-professors",
    label: "프로젝트 실행 2/2",
    title: "프로젝트 성공에 필요한 교수님을 찾아요",
    purpose: "개인 고민이 아니라 선택한 프로젝트의 주제, 방법, 응용에 필요한 전문성을 기준으로 연결해요.",
    now: "역할별 추천 이유와 공식 근거를 비교해 프로젝트에 도움을 받을 교수님을 확인해 보세요.",
    next: "선택과 대화 기록은 나의 성장과정에 이어져요.",
    steps: [
      { title: "프로젝트 선택", description: "먼저 AI 프로젝트 설계를 마치고 후보 중 하나를 선택해요." },
      { title: "추천 불러오기", description: "프로젝트 결과에서 맞춤 교수 추천을 눌러 역할별 후보를 불러와요." },
      { title: "역할·근거 비교", description: "연구주제·방법론·응용 맥락별 추천 이유와 공식 근거를 비교해요." },
    ],
    areas: [
      { title: "추천을 이어갈 다음 행동", description: "현재 프로젝트 상태에 맞춰 설계·선택·추천 중 필요한 버튼을 보여줘요.", selector: '[data-service-help="project-primary"]' },
      { title: "선택 프로젝트", description: "어떤 프로젝트를 기준으로 교수 추천을 만드는지 확인해요.", selector: '[data-service-help="project-summary"]' },
      { title: "추천 기준과 신뢰 안내", description: "역할별 연결 기준과 공식 정보 사용 범위를 설명하는 영역이에요.", selector: '[data-service-help="recommendation-criteria"]' },
    ],
  },
  "/portfolio": {
    section: "/portfolio",
    label: "나의 성장과정",
    title: "내가 쌓은 경험과 생각의 변화를 모아요",
    purpose: "교수 연결, 프로젝트 설계, 면담 뒤 행동, AI 교수님 대화를 성장 흐름으로 보는 곳이에요.",
    now: "AI 교수님과 대화를 이어가거나 비어 있는 다음 기록을 채워 보세요.",
    next: "저장한 변화는 포트폴리오와 생각 지도에서 다시 활용할 수 있어요.",
    steps: [
      { title: "AI 교수님과 대화", description: "대화를 시작하거나 이어가며 지금 고민과 프로젝트 생각을 정리해요." },
      { title: "다음 기록 채우기", description: "최근 생각 지도와 다음 기록 제안을 보고 비어 있는 단계를 채워요." },
      { title: "성장 흐름 정리", description: "프로젝트·교수 연결 기록을 돌아보고 포트폴리오로 정리해요." },
    ],
    areas: [
      { title: "나의 AI 교수님", description: "대화와 생각 지도를 통해 현재 고민의 변화와 갈래를 확인해요.", selector: '[data-service-help="growth-ai-professor"]' },
      { title: "다음 기록 제안", description: "지금 비어 있는 성장 기록과 바로 이어갈 버튼을 보여줘요.", selector: '[data-service-help="growth-next-record"]' },
      { title: "내 방향의 변화", description: "처음 고민에서 현재 행동까지 어떻게 구체화됐는지 비교해요.", selector: '[data-service-help="growth-story"]' },
    ],
  },
};

const AI_PROFESSOR_HELP: ServiceHelpCopy = {
  section: "/portfolio",
  label: "나의 성장과정",
  title: "AI 교수님과 생각을 정리하고 갈래를 만들어요",
  purpose: "짧은 대화에서 고민의 핵심을 찾고, 새 질문이 생기면 생각 지도를 여러 갈래로 넓혀요.",
  now: "대화하기에서 고민을 말하거나, 대화 지도에서 정리된 생각과 원문을 열어 보세요.",
  next: "내 맥락에서 저장한 메모를 확인하고 실제 교수 만남이나 프로젝트 설계로 이어갈 수 있어요.",
  steps: [
    { title: "가볍게 대화", description: "지금 고민이나 아이디어를 짧게 말하면 핵심과 선택지를 정리해요." },
    { title: "생각 지도 확인", description: "질문·발견·행동이 어떤 갈래로 이어졌는지 살펴봐요." },
    { title: "핵심을 남기기", description: "중요한 생각만 성장 메모로 저장하고 실제 만남·프로젝트로 이어가요." },
  ],
  areas: [
    { title: "보기 방식 선택", description: "대화하기, 대화 지도, 내 맥락을 오가며 같은 기록을 다른 방식으로 확인해요.", selector: 'nav[aria-label="AI 교수님 보기 방식"]' },
    { title: "현재 AI 교수님 화면", description: "현재 선택한 보기 방식의 대화·생각 지도·성장 맥락을 보여줘요.", selector: 'section[aria-labelledby="ai-professor-conversation"], section[aria-labelledby="conversation-map-title"], aside[aria-label="나의 성장 맥락과 저장 메모"]' },
    { title: "다음 생각 이어가기", description: "추천 질문을 고르거나 직접 입력해 새로운 대화 갈래를 만들 수 있어요.", selector: '[aria-label="이어갈 대화 예시"], nav[aria-label="다음 성장 행동"]' },
  ],
};

const PROFESSOR_HUB_HELP: ServiceHelpCopy = {
  section: "/professors",
  label: "교수 연결 1/2",
  title: "교수 연결의 현재 상태와 다음 행동을 확인해요",
  purpose: "첫 설정을 마친 뒤 다시 찾기, 후보 비교, 선택한 교수 확인을 한곳에서 이어가는 교수 탭 홈이에요.",
  now: "가장 위 카드에서 지금 필요한 행동 하나를 시작하거나, 내 교수 연결에서 저장한 상태를 확인하세요.",
  next: "교수 한 분을 선택하면 교수 만남 준비 탭에서 첫 질문과 연락을 준비할 수 있어요.",
  steps: [
    { title: "지금 할 일 확인", description: "설정과 교수 선택 상태에 맞춰 가장 먼저 할 행동을 확인해요." },
    { title: "연결 상태 확인", description: "선택한 교수와 저장한 교수를 한곳에서 확인해요." },
    { title: "다시 찾거나 관리", description: "조건을 바꿔 새로 찾거나 저장한 연결을 관리해요." },
  ],
  areas: [
    { title: "지금 필요한 교수 연결", description: "현재 상태에 따라 교수 찾기, 피칭 이어보기, 대화 준비 중 하나를 먼저 보여줘요.", selector: '[data-service-help="professor-hub-primary"]' },
    { title: "내 교수 연결", description: "선택한 교수와 저장한 교수를 확인하고 해당 화면으로 바로 이동해요.", selector: '[data-service-help="professor-hub-connection"]' },
    { title: "다시 찾기와 관리", description: "조건을 직접 입력해 다시 찾거나 저장한 연결 기록을 관리해요.", selector: '[data-service-help="professor-hub-tools"]' },
  ],
};

const MENTOR_LOOP_HELP: ServiceHelpCopy = {
  section: "/quest",
  label: "교수 만남 후 · 다음 만남 씨앗",
  title: "교수님의 조언을 수정과 행동으로 이어가요",
  purpose: "면담에서 들은 핵심을 남기고, 연구안의 변화와 이번 주 행동을 하나의 기록으로 만드는 화면이에요.",
  now: "받은 조언부터 한 단계씩 정리하세요. 현재 단계만 화면에 보여서 필요한 내용에 집중할 수 있어요.",
  next: "저장하면 7일 행동과 감사 이메일 초안이 만들어지고, 기록은 나의 성장과정에 이어져요.",
  steps: [
    { title: "받은 조언 정리", description: "면담일과 교수님이 강조한 핵심을 적고, 필요하면 추천 자료와 주의점도 남겨요." },
    { title: "연구안 수정", description: "기존 질문·방법·범위와 조언을 반영한 수정 문장을 나란히 비교해요." },
    { title: "7일 행동 저장", description: "교수님께 약속한 일과 이번 주 행동, 다음 확인 날짜를 정해 저장해요." },
  ],
  areas: [
    { title: "세 단계 진행 순서", description: "받은 조언, 연구 수정, 7일 행동 중 현재 위치를 확인하고 필요한 단계로 이동해요.", selector: '[data-service-help="mentor-loop-progress"]' },
    { title: "현재 단계 입력", description: "지금 단계에 필요한 내용만 보여줘요. 입력한 내용은 같은 교수·주제 기록으로 이어집니다.", selector: '[data-service-help="mentor-loop-stage"]' },
    { title: "이전·다음·저장", description: "이전 단계로 돌아가거나 다음 단계로 이동하고, 마지막에는 7일 계획과 이메일 초안을 저장해요.", selector: '[data-service-help="mentor-loop-actions"]' },
  ],
};

export function getServiceHelpCopy(
  pathname: string,
  searchParams?: SearchParamsLike,
): ServiceHelpCopy {
  if (pathname.startsWith("/portfolio/ai-professor")) return AI_PROFESSOR_HELP;
  if (pathname.startsWith("/mentor-loop")) return MENTOR_LOOP_HELP;
  if (pathname === "/professors") return PROFESSOR_HUB_HELP;

  const section = resolveServiceSection(pathname, searchParams);
  if (section && section !== "/profile") return SECTION_HELP[section];

  return {
    ...SECTION_HELP["/home"],
    title: "이 화면에서 할 수 있는 일을 알려드려요",
    purpose: "현재 화면의 핵심 기능을 확인하고 다음 서비스로 자연스럽게 이어갈 수 있어요.",
  };
}
