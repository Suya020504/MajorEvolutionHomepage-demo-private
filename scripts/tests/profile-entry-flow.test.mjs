import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const entryGate = source("components/landing/entry-gate.tsx");
const profileStore = source("store/profile-store.ts");
const profileScreen = source("components/screens/profile-screen.tsx");
const sideNav = source("components/app/side-nav.tsx");
const landing = source("components/landing/landing-page.tsx");
const landingProductPreview = source("components/landing/landing-product-preview.tsx");
const landingProductPreviewStyles = source("components/landing/landing-product-preview.module.css");
const professorTutorial = source("components/tutorial/professor-tutorial-screen.tsx");
const researchTutorial = source("components/tutorial/research-tutorial-screen.tsx");
const welcomePage = source("app/welcome/page.tsx");
const portfolioHub = source("components/screens/portfolio-hub-screen.tsx");
const recordsPage = source("app/portfolio/manage/page.tsx");

test("최초 진입만 랜딩을 보여주고 서비스 이용 뒤에는 홈으로 보낸다", () => {
  assert.match(entryGate, /hasEnteredService/);
  assert.match(entryGate, /hasExistingJourney/);
  assert.match(entryGate, /router\.replace\("\/home"\)/);
  assert.match(entryGate, /return <LandingPage \/>/);
  assert.match(landing, /markServiceEntered/);
  assert.doesNotMatch(landing, /href="\/tutorial"[^>]+onClick=\{markServiceEntered\}/);
  assert.match(professorTutorial, /markServiceEntered\(\);/);
  assert.match(researchTutorial, /markServiceEntered\(\);/);
});

test("랜딩에서 실제 서비스 화면과 AI 대화의 생각 진화 과정을 미리 본다", () => {
  assert.match(landing, /LandingProductPreview/);
  assert.match(landing, /href: "#preview"/);
  assert.match(landingProductPreview, /실제 서비스 미리보기/);
  assert.match(landingProductPreview, /AI 교수님/);
  assert.match(landingProductPreview, /교수 3인 피칭/);
  assert.match(landingProductPreview, /AI 프로젝트 설계/);
  assert.match(landingProductPreview, /생각 씨앗/);
  assert.match(landingProductPreview, /발견한 단서/);
  assert.match(landingProductPreview, /다음 발걸음/);
  assert.match(landingProductPreview, /원문 대화와 성장 메모 연결/);
  assert.match(landingProductPreviewStyles, /@media \(max-width: 767px\)/);
  assert.match(landingProductPreviewStyles, /\.aiPreview \{[\s\S]*?grid-template-columns/);
});

test("마이페이지 정보는 브라우저 로컬 저장소에만 보존한다", () => {
  assert.match(profileStore, /createJSONStorage\(\(\) => localStorage\)/);
  assert.match(profileStore, /major-evolution-profile-v1/);
  assert.match(profileStore, /saveProfile/);
  assert.match(profileScreen, /입력 내용은 현재 브라우저에만 저장됩니다/);
  assert.match(profileScreen, /내 정보 저장/);
});

test("좌측 하단 프로필과 랜딩 다시 보기 경로가 분리되어 있다", () => {
  assert.match(sideNav, /side-nav__footer/);
  assert.match(sideNav, /href="\/profile"/);
  assert.match(sideNav, /href="\/home"/);
  assert.match(profileScreen, /href="\/welcome"/);
  assert.match(welcomePage, /<LandingPage \/>/);
});

test("내 기록 관리는 성장 허브가 아니라 마이페이지에서 진입한다", () => {
  assert.doesNotMatch(portfolioHub, /내 기록 관리/);
  assert.match(profileScreen, /href="\/portfolio\/manage"/);
  assert.match(profileScreen, /내 기록 관리/);
  assert.match(profileScreen, /저장한 기록을 백업하거나 필요한 항목만 직접 정리해요/);
  assert.match(recordsPage, /backHref="\/profile"/);
});
