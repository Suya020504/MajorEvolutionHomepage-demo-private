import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function loadTypeOnlyModule(relativePath) {
  const sourcePath = path.join(repositoryRoot, relativePath);
  assert.ok(existsSync(sourcePath), `${relativePath} 상태 계약 모듈이 필요합니다.`);
  const compiled = ts.transpileModule(readFileSync(sourcePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("exports", "module", compiled)(loaded.exports, loaded);
  return loaded.exports;
}

const state = loadTypeOnlyModule("lib/professor-match-state.ts");
const topicContext = loadTypeOnlyModule("lib/research-topic-context.ts");

const studentBucket = {
  matches: [{ professor: { id: "student-professor" } }],
  coverage: { scopeStatus: "SUPPORTED" },
  status: "success",
  error: null,
  topicId: "discovery:career-data",
  rejectedIds: ["student-rejected"],
  selectedProfessorId: "student-professor",
};

const projectBucket = {
  matches: [{ professor: { id: "project-professor" } }],
  coverage: { scopeStatus: "SUPPORTED" },
  status: "success",
  error: null,
  topicId: "project-1",
  rejectedIds: [],
  selectedProfessorId: "project-professor",
};

test("학생 교수 탐색만 초기화해도 프로젝트 추천과 선택은 유지한다", () => {
  assert.ok(state, "교수 추천 상태 분리 계약이 필요합니다.");
  const next = state.clearStudentProfessorMatchBucket({ studentBucket, projectBucket });

  assert.deepEqual(next.studentBucket, {
    matches: [], coverage: null, status: "idle", error: null, topicId: null,
    rejectedIds: [], selectedProfessorId: null,
  });
  assert.deepEqual(next.projectBucket, projectBucket);
});

test("기존 공유 추천 저장값은 선택한 프로젝트 주제와 일치할 때만 프로젝트 버킷으로 이관한다", () => {
  const migratedProject = state.migrateProfessorMatchBuckets({
    selectedTopicId: "project-1",
    professorMatchTopicId: "project-1",
    professorMatches: projectBucket.matches,
    professorCoverage: projectBucket.coverage,
    professorMatchStatus: "success",
    professorMatchError: null,
    professorRejectedIds: [],
    selectedProfessorId: "project-professor",
  });
  assert.deepEqual(migratedProject.projectBucket, projectBucket);
  assert.equal(migratedProject.studentBucket.matches.length, 0);

  const migratedStudent = state.migrateProfessorMatchBuckets({
    selectedTopicId: "project-1",
    professorMatchTopicId: "discovery:career-data",
    professorMatches: studentBucket.matches,
    professorCoverage: studentBucket.coverage,
    professorMatchStatus: "success",
    professorMatchError: null,
    professorRejectedIds: studentBucket.rejectedIds,
    selectedProfessorId: "student-professor",
  });
  assert.deepEqual(migratedStudent.studentBucket, studentBucket);
  assert.equal(migratedStudent.projectBucket.matches.length, 0);
});

test("현재 학생 탐색 맥락은 과거 프로젝트 선택보다 첫 대화 주제에서 우선한다", () => {
  const projectTopic = {
    id: "project-1", pairId: "pair", variant: "안전 축소형", title: "과거 프로젝트",
    majors: [], interests: [], methods: [], minWeeks: 4, goodDataAccess: ["아직 모름"],
    avoidTags: [], question: "과거 질문", reason: "", userConfirmed: [], aiProposed: [],
    dataOptions: [], methodDetail: "", scope: "", uncertainties: [], firstAction: "", evidence: [],
  };
  const result = { kind: "insufficient", candidate: { topic: projectTopic } };
  const topic = topicContext.resolveJourneyTopic({
    result,
    selectedTopicId: "project-1",
    professorDiscoveryTopic: {
      id: "discovery:current", title: "현재 진로 고민", question: "지금 무엇을 시작할까요?",
      major: "경제학과", interests: ["데이터"], methods: [], methodDetail: "", scope: "",
      careerConcerns: [], additionalContext: "",
    },
  });

  assert.equal(topic?.id, "discovery:current");
  assert.equal(topic?.title, "현재 진로 고민");
});

test("일반 교수 만남은 학생 탐색에서 선택한 교수만 사용한다", () => {
  assert.equal(typeof state.resolveStudentProfessorMatch, "function");

  const active = state.resolveStudentProfessorMatch({
    studentMatches: studentBucket.matches,
    selectedStudentProfessorId: null,
  });
  assert.equal(active, null);
});

test("유효한 학생 교수 선택이 있으면 프로젝트 선택보다 현재 찾다 맥락을 우선한다", () => {
  const active = state.resolveActiveProfessorMatch({
    studentMatches: studentBucket.matches,
    selectedStudentProfessorId: "student-professor",
    projectMatches: projectBucket.matches,
    selectedProjectProfessorId: "project-professor",
  });

  assert.equal(active?.source, "student");
  assert.equal(active?.match.professor.id, "student-professor");
});

test("프로젝트 교수 기록을 지울 때 학생 교수 매칭은 그대로 보존한다", () => {
  assert.equal(typeof state.removeProfessorFromMatchBuckets, "function");

  const next = state.removeProfessorFromMatchBuckets({
    source: "project",
    professorId: "project-professor",
    studentMatches: studentBucket.matches,
    selectedStudentProfessorId: "student-professor",
    projectMatches: projectBucket.matches,
    selectedProjectProfessorId: "project-professor",
  });

  assert.deepEqual(next.studentMatches, studentBucket.matches);
  assert.equal(next.selectedStudentProfessorId, "student-professor");
  assert.deepEqual(next.projectMatches, []);
  assert.equal(next.selectedProjectProfessorId, null);
});

test("새 프로젝트 교수를 선택해도 일반 교수 만남 선택은 유지한다", () => {
  assert.equal(typeof state.activateProfessorSelection, "function");
  assert.deepEqual(
    state.activateProfessorSelection({
      source: "project",
      professorId: "project-professor",
      selectedStudentProfessorId: "student-professor",
      selectedProjectProfessorId: null,
    }),
    {
      selectedStudentProfessorId: "student-professor",
      selectedProjectProfessorId: "project-professor",
    },
  );
});

test("일반 교수를 다시 선택해도 프로젝트 자문 교수 선택은 유지한다", () => {
  assert.deepEqual(
    state.activateProfessorSelection({
      source: "student",
      professorId: "student-professor",
      selectedStudentProfessorId: null,
      selectedProjectProfessorId: "project-professor",
    }),
    {
      selectedStudentProfessorId: "student-professor",
      selectedProjectProfessorId: "project-professor",
    },
  );
});

test("명시 선택이 없을 때만 즐겨찾기 일반 교수를 학생 맥락으로 사용한다", () => {
  const active = state.resolveActiveProfessorMatch({
    studentMatches: studentBucket.matches,
    selectedStudentProfessorId: null,
    projectMatches: [],
    selectedProjectProfessorId: null,
    favoriteStudentProfessorIds: ["student-professor"],
  });

  assert.equal(active?.source, "student");
  assert.equal(active?.match.professor.id, "student-professor");
});

test("논문 교수는 실제로 포함된 추천 버킷의 활성 선택으로 전환한다", () => {
  assert.equal(typeof state.professorMatchSourceForId, "function");
  assert.equal(state.professorMatchSourceForId({
    professorId: "project-professor",
    studentMatches: studentBucket.matches,
    projectMatches: projectBucket.matches,
  }), "project");
  assert.equal(state.professorMatchSourceForId({
    professorId: "missing",
    studentMatches: studentBucket.matches,
    projectMatches: projectBucket.matches,
  }), null);
});
