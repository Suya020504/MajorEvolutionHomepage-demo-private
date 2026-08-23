import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigationSource = readFileSync(
  new URL("../../components/app/side-nav.tsx", import.meta.url),
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

test("서비스 탭은 교수 여정 뒤 프로젝트 여정 순서로 이어진다", () => {
  const labels = [
    'label: "홈"',
    'label: "교수 매칭"',
    'label: "교수 만남 연계"',
    'label: "AI 프로젝트 설계"',
    'label: "맞춤 교수 추천"',
  ];

  const positions = labels.map((label) => navigationSource.indexOf(label));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.match(navigationSource, /shortLabel: "매칭"/);
  assert.match(navigationSource, /shortLabel: "만남"/);
  assert.match(navigationSource, /shortLabel: "프로젝트"/);
  assert.match(navigationSource, /shortLabel: "추천"/);
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
