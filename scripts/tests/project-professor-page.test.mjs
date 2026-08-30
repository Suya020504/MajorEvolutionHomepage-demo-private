import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadModule() {
  const sourceUrl = new URL("../../lib/project-professor-page.ts", import.meta.url);
  if (!existsSync(fileURLToPath(sourceUrl))) return null;
  const source = readFileSync(sourceUrl, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("exports", "module", compiled)(loaded.exports, loaded);
  return loaded.exports;
}

const page = loadModule();

test("교수 후보는 순위가 아니라 연구주제·연구방법·응용확장 역할 순서로 배치한다", () => {
  assert.ok(page, "프로젝트 교수 추천 페이지 계약 모듈이 필요합니다.");
  const matches = [
    { role: "CONTEXT", professor: { id: "context" } },
    { role: "TOPIC", professor: { id: "topic" } },
    { role: "METHOD", professor: { id: "method" } },
  ];
  assert.deepEqual(page.buildProjectProfessorRoleSlots(matches).map((slot) => ({
    role: slot.role,
    label: slot.label,
    professorId: slot.match?.professor.id ?? null,
  })), [
    { role: "TOPIC", label: "연구주제 멘토", professorId: "topic" },
    { role: "METHOD", label: "연구방법 멘토", professorId: "method" },
    { role: "CONTEXT", label: "응용·확장 멘토", professorId: "context" },
  ]);
});

test("교수를 직접 선택한 뒤에만 프로젝트 실행 홈으로 이동한다", () => {
  assert.ok(page, "프로젝트 교수 추천 페이지 계약 모듈이 필요합니다.");
  assert.deepEqual(page.projectProfessorNextAction(null), {
    label: "면담할 교수님을 선택해 주세요",
    href: null,
    disabled: true,
  });
  assert.deepEqual(page.projectProfessorNextAction("professor-1"), {
    label: "선택한 교수님과 프로젝트 시작하기",
    href: "/project-execution",
    disabled: false,
  });
});
