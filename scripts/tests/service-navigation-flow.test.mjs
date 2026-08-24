import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigationSource = readFileSync(
  new URL("../../components/app/side-nav.tsx", import.meta.url),
  "utf8",
);
const globalStyleSource = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const installPromptSource = readFileSync(
  new URL("../../components/pwa/install-prompt.tsx", import.meta.url),
  "utf8",
);
const homeSource = readFileSync(
  new URL("../../components/screens/unified-home-screen.tsx", import.meta.url),
  "utf8",
);
const professorOverlaySource = readFileSync(
  new URL("../../components/screens/professor-quick-start-overlay.tsx", import.meta.url),
  "utf8",
);
const professorTutorialSource = readFileSync(
  new URL("../../components/tutorial/professor-tutorial-screen.tsx", import.meta.url),
  "utf8",
);
const projectProfessorHubSource = readFileSync(
  new URL("../../components/screens/project-professor-hub-screen.tsx", import.meta.url),
  "utf8",
);
const questHubSource = readFileSync(
  new URL("../../components/screens/quest-hub-screen.tsx", import.meta.url),
  "utf8",
);
const portfolioHubSource = readFileSync(
  new URL("../../components/screens/portfolio-hub-screen.tsx", import.meta.url),
  "utf8",
);
const portfolioHubStyleSource = readFileSync(
  new URL("../../components/screens/portfolio-hub-screen.module.css", import.meta.url),
  "utf8",
);
const serviceHubStyleSource = readFileSync(
  new URL("../../components/app/service-hub.module.css", import.meta.url),
  "utf8",
);
const researchStoreSource = readFileSync(
  new URL("../../store/research-store.ts", import.meta.url),
  "utf8",
);
const dataControlsSource = readFileSync(
  new URL("../../components/screens/data-controls.tsx", import.meta.url),
  "utf8",
);
const aiProfessorStoreSource = readFileSync(
  new URL("../../store/ai-professor-store.ts", import.meta.url),
  "utf8",
);
const questStoreSource = readFileSync(
  new URL("../../store/quest-store.ts", import.meta.url),
  "utf8",
);

test("서비스 탭은 교수 여정 뒤 프로젝트 여정 순서로 이어진다", () => {
  const labels = [
    'label: "홈"',
    'label: "교수 매칭"',
    'label: "교수 만남 준비"',
    'label: "AI 프로젝트 설계"',
    'label: "맞춤 교수 추천"',
    'label: "나의 성장과정"',
  ];

  const positions = labels.map((label) => navigationSource.indexOf(label));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.match(navigationSource, /shortLabel: "매칭"/);
  assert.match(navigationSource, /shortLabel: "만남"/);
  assert.match(navigationSource, /shortLabel: "프로젝트"/);
  assert.match(navigationSource, /shortLabel: "추천"/);
  assert.match(navigationSource, /shortLabel: "성장"/);
  assert.match(navigationSource, /"\/portfolio": "\/portfolio"/);
  assert.match(navigationSource, /navigationJourney/);
  assert.match(navigationSource, /교수 연결 여정/);
  assert.match(navigationSource, /프로젝트 여정/);
  assert.match(navigationSource, /is-project-journey-start/);
  assert.match(navigationSource, /is-professor-journey-start/);
  assert.match(navigationSource, /side-nav__journey-step/);
});

test("첫 홈 진입에서는 AI 마스코트가 여섯 하단 탭의 역할을 순서대로 안내한다", () => {
  assert.match(navigationSource, /major-evolution-bottom-nav-guide-v1/);
  assert.match(navigationSource, /NAV_GUIDE_STEPS/);
  assert.match(navigationSource, /label: "홈"[\s\S]*label: "교수 매칭"[\s\S]*label: "교수 만남 준비"/);
  assert.match(navigationSource, /label: "AI 프로젝트 설계"[\s\S]*label: "맞춤 교수 추천"[\s\S]*label: "나의 성장과정"/);
  assert.match(navigationSource, /guideCharacter\.connectOpener/);
  assert.match(navigationSource, /window\.location\.search\.length === 0/);
  assert.match(navigationSource, /matchMedia\("\(max-width: 1023px\)"\)/);
  assert.match(navigationSource, /role="dialog"/);
  assert.match(navigationSource, /aria-live="polite"/);
  assert.match(navigationSource, /건너뛰기/);
  assert.match(navigationSource, /이전/);
  assert.match(navigationSource, /"시작하기" : "다음"/);
  assert.match(navigationSource, /event\.key === "Escape"/);
  assert.match(navigationSource, /data-service-nav-guide-open/);
  assert.match(globalStyleSource, /\.service-bottom-nav__guide/);
  assert.match(globalStyleSource, /--nav-guide-anchor/);
  assert.match(globalStyleSource, /\.service-bottom-nav a\.is-guide-target/);
  assert.match(globalStyleSource, /@media \(max-width: 420px\)/);
  assert.match(installPromptSource, /hasAttribute\("data-service-nav-guide-open"\)/);
});

test("교수 매칭은 홈을 유지한 빠른 시작 패널에서 기존 튜토리얼을 재사용한다", () => {
  assert.match(navigationSource, /href: "\/home\?professor=quick"/);
  assert.match(homeSource, /searchParams\.get\("professor"\) === "quick"/);
  assert.match(homeSource, /<ProfessorQuickStartOverlay/);
  assert.match(professorOverlaySource, /role="dialog"/);
  assert.match(professorOverlaySource, /presentation="overlay"/);
  assert.match(professorTutorialSource, /onRequestClose\?: \(\) => void/);
});

test("맞춤 교수 추천 탭은 프로젝트 진행 상태마다 막히지 않는 다음 행동을 제공한다", () => {
  assert.match(projectProfessorHubSource, /AI 프로젝트 설계하기/);
  assert.match(projectProfessorHubSource, /프로젝트 후보 고르기/);
  assert.match(projectProfessorHubSource, /맞춤 교수 추천 확인하기/);
  assert.match(projectProfessorHubSource, /rankingSource === "ai-reranked"/);
  assert.match(projectProfessorHubSource, /\/result#professor-connection/);
});

test("피칭에서 고른 교수는 즐겨찾기 없이도 대화 준비의 연결 교수로 인정한다", () => {
  assert.match(questHubSource, /selectedProfessorId/);
  assert.match(questHubSource, /professorMatches\.find/);
  assert.match(questHubSource, /hasConnectedProfessor/);
  assert.match(questHubSource, /교수님의 연구를 살펴볼 차례예요/);
});

test("교수 만남 준비 화면은 선택부터 면담 후 기록까지 현재 단계를 드러낸다", () => {
  assert.match(questHubSource, /첫 만남 여정/);
  assert.match(questHubSource, /지금 어디까지 준비했나요/);
  assert.match(questHubSource, /label: "교수 선택"/);
  assert.match(questHubSource, /label: "만나기 전"/);
  assert.match(questHubSource, /label: "대화 중"/);
  assert.match(questHubSource, /label: "만난 후"/);
  assert.match(questHubSource, /aria-current=\{isCurrent \? "step"/);
});

test("나의 성장과정은 프로젝트와 교수 연결을 현재 결과와 분리해 보존한다", () => {
  assert.match(researchStoreSource, /growthDirectionBaseline/);
  assert.match(researchStoreSource, /growthProjectHistory:\s*appendGrowthProjectRecord/);
  assert.match(researchStoreSource, /growthProfessorHistory:\s*mergeGrowthProfessorHistory/);
  assert.match(researchStoreSource, /version:\s*7/);
  assert.match(portfolioHubSource, /내 방향이 구체화된 흐름/);
  assert.match(portfolioHubSource, /프로젝트 설계 기록/);
  assert.match(portfolioHubSource, /지금까지 연결한 교수님/);
  assert.match(portfolioHubSource, /입력하지 않은 변화는 추정하지 않고/);
});

test("성장 허브는 AI 교수님을 핵심 경험으로, 다음 기록은 보조 행동으로 구분한다", () => {
  assert.match(portfolioHubSource, /성장과정의 중심/);
  assert.match(portfolioHubSource, /AI 교수님과 대화 이어가기/);
  assert.match(portfolioHubSource, /나눈 대화/);
  assert.match(portfolioHubSource, /대화 갈래/);
  assert.match(portfolioHubSource, /다음 기록 제안/);
  assert.doesNotMatch(portfolioHubSource, /HubPrimaryTask/);
  assert.match(portfolioHubStyleSource, /\.aiProfessorSection[\s\S]*linear-gradient/);
  assert.match(portfolioHubStyleSource, /\.nextRecordCard/);
  assert.match(serviceHubStyleSource, /@media \(min-width: 1024px\)[\s\S]*\.primaryTask/);
  assert.match(serviceHubStyleSource, /@media \(max-width: 1023px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
});

test("내 기록 관리는 백업과 항목별 개별 삭제를 제공한다", () => {
  assert.match(dataControlsSource, /현재 브라우저에만 저장돼요/);
  assert.match(dataControlsSource, /기록 내려받기/);
  assert.match(dataControlsSource, /나의 방향과 프로젝트/);
  assert.match(dataControlsSource, /교수 연결과 만남/);
  assert.match(dataControlsSource, /나의 AI 교수님/);
  assert.match(dataControlsSource, /개 항목별 관리/);
  assert.match(dataControlsSource, /이 항목만 삭제/);
  assert.match(dataControlsSource, /나머지 기록은 그대로 남아요/);
  assert.doesNotMatch(dataControlsSource, /category\.clear/);
  assert.match(researchStoreSource, /clearGrowthDirectionBaseline:\s*\(\) =>/);
  assert.match(researchStoreSource, /removeGrowthProjectRecord:\s*\(topicId\) =>/);
  assert.match(researchStoreSource, /removeGrowthProfessorRecord:\s*\(professorId, source\) =>/);
  assert.match(researchStoreSource, /deleteKnockKitDraft:\s*\(key\) =>/);
  assert.match(researchStoreSource, /deleteMentorLoopEntry:\s*\(key\) =>/);
  assert.match(researchStoreSource, /removeFavoriteProfessors:\s*\(ids\) =>/);
  assert.match(questStoreSource, /deleteCard:\s*\(id\) =>/);
  assert.match(aiProfessorStoreSource, /removeConversationBranch:\s*\(messageId\) =>/);
  assert.match(aiProfessorStoreSource, /removeGrowthNote:\s*\(id\) =>/);

  const branchRemoval = aiProfessorStoreSource.slice(
    aiProfessorStoreSource.indexOf("removeConversationBranch: (messageId)"),
    aiProfessorStoreSource.indexOf("removeGrowthNote: (id)"),
  );
  assert.match(branchRemoval, /messages:\s*state\.messages\.filter/);
  assert.match(branchRemoval, /mapDecisions/);
  assert.doesNotMatch(branchRemoval, /growthNotes:/);
});
