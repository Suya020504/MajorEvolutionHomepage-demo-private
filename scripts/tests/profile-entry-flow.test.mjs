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
const professorTutorial = source("components/tutorial/professor-tutorial-screen.tsx");
const researchTutorial = source("components/tutorial/research-tutorial-screen.tsx");
const welcomePage = source("app/welcome/page.tsx");

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
