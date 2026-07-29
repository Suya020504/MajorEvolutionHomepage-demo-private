import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../..");
const runtimeDirectory = fs.mkdtempSync(path.join(testDirectory, ".professor-discovery-runtime-"));

function compileCommonJs(sourceRelativePath, outputName) {
  const source = fs.readFileSync(path.join(repositoryRoot, sourceRelativePath), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourceRelativePath,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.equal(errors.length, 0, `테스트용 변환 실패: ${sourceRelativePath}`);
  const outputPath = path.join(runtimeDirectory, outputName);
  fs.writeFileSync(outputPath, compiled.outputText, "utf8");
  return outputPath;
}

const taxonomyModule = require(
  compileCommonJs("lib/professor-academic-taxonomy.ts", "professor-academic-taxonomy.cjs"),
);
const discoveryModule = require(
  compileCommonJs("lib/professor-discovery-model.ts", "professor-discovery-model.cjs"),
);
const evidenceModule = require(
  compileCommonJs("lib/professor-match-evidence.ts", "professor-match-evidence.cjs"),
);

after(() => fs.rmSync(runtimeDirectory, { recursive: true, force: true }));

test("공식 교수 데이터에서 안전한 단과대-학과 관계만 만든다", () => {
  const runtime = JSON.parse(fs.readFileSync(
    path.join(repositoryRoot, "data/professors/runtime/dku-professors.json"),
    "utf8",
  ));
  const taxonomy = taxonomyModule.buildProfessorAcademicTaxonomy(
    runtime.records.map((record) => ({
      college: record.college,
      departments: record.departments,
    })),
    runtime.official_record_count,
    runtime.coverage_gaps.map((gap) => gap.department),
  );

  assert.equal(taxonomy.officialProfessorCount, 1_051);
  assert.equal(taxonomy.colleges.length, 20);
  assert.equal(taxonomyModule.countMappedDepartments(taxonomy), 111);
  assert.deepEqual(
    taxonomy.unmappedDepartments,
    ["골프전공", "동물생명공학전공", "연기영상예술학과", "한국학과"],
  );
  assert.ok(taxonomy.colleges.some((college) => college.name === "음악·예술대학"));
  assert.ok(taxonomy.colleges.every((college) => !college.name.includes(" · ")));
});

test("일반 전공명은 유일한 공식 학과로 보정하고 중복 학과는 추측하지 않는다", () => {
  const taxonomy = taxonomyModule.buildProfessorAcademicTaxonomy([
    { college: "경영경제대학", departments: ["경제학과"] },
    { college: "사회과학대학", departments: ["정치외교학과"] },
  ], 2);
  assert.deepEqual(
    taxonomyModule.findAcademicSelection(taxonomy, "경제학"),
    { college: "경영경제대학", department: "경제학과" },
  );

  const ambiguous = taxonomyModule.buildProfessorAcademicTaxonomy([
    { college: "가대학", departments: ["융합학과"] },
    { college: "나대학", departments: ["융합학과"] },
  ], 2);
  assert.equal(taxonomyModule.findAcademicSelection(ambiguous, "융합학"), null);
});

test("기본 질문과 부전공 무결성을 검증한다", () => {
  const valid = {
    ...discoveryModule.EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
    university: "단국대학교",
    college: "경영경제대학",
    major: "경제학과",
    studentStage: "취업을 준비하는 중",
    goal: "취업·직무 조언 받기",
    interests: ["경제·금융"],
    careerConcerns: ["취업시장·전망"],
  };
  assert.equal(discoveryModule.validateProfessorDiscoveryBasics(valid), null);
  assert.equal(discoveryModule.validateProfessorDiscoverySecondary(valid), null);

  const sameSecondary = {
    ...valid,
    secondaryMajorType: "부전공",
    secondaryMajor: "경제학과",
  };
  assert.match(
    discoveryModule.validateProfessorDiscoverySecondary(sameSecondary),
    /주전공과 다른/,
  );
  assert.deepEqual(
    discoveryModule.toggleLimitedValue(["A", "B"], "C", 2),
    ["A", "B"],
  );
});

test("진로 고민과 만남 맥락은 공식 연구근거 검색문에 섞지 않는다", () => {
  const context = {
    ...discoveryModule.EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
    university: "단국대학교",
    college: "경영경제대학",
    major: "경제학과",
    studentStage: "취업을 준비하는 중",
    goal: "프로젝트·학부연구 참여",
    interests: ["AI·데이터", "경제·금융"],
    secondaryMajorType: "부전공",
    secondaryCollege: "SW융합대학",
    secondaryMajor: "소프트웨어학과",
    careerInterests: ["데이터·AI 직무"],
    careerConcerns: ["취업시장·전망", "필요한 역량·포트폴리오"],
    careerGoal: "민간기업 취업",
    meetingSituation: "오피스아워",
    preferredSupport: "진로 경험과 준비법을 듣고 싶어요",
    experience: "통계 수업과 설문 프로젝트 경험",
    additionalContext: "포트폴리오가 부족해요",
  };
  const topic = discoveryModule.discoveryContextToMatchTopic(context, null);
  const text = evidenceModule.buildProfessorEvidenceText(topic);

  assert.match(text, /경제학과/);
  assert.match(text, /소프트웨어학과/);
  assert.match(text, /데이터·AI 직무/);
  assert.doesNotMatch(text, /프로젝트·학부연구 참여/);
  assert.doesNotMatch(text, /취업을 준비하는 중/);
  assert.doesNotMatch(text, /취업시장·전망/);
  assert.doesNotMatch(text, /필요한 역량·포트폴리오/);
  assert.doesNotMatch(text, /민간기업 취업/);
  assert.doesNotMatch(text, /오피스아워/);
  assert.doesNotMatch(text, /진로 경험과 준비법/);
  assert.doesNotMatch(text, /통계 수업과 설문 프로젝트 경험/);
  assert.doesNotMatch(text, /포트폴리오가 부족해요/);
});

test("기본·심층 맥락은 세 개의 면담 질문으로 변환된다", () => {
  const questions = discoveryModule.buildProfessorContextQuestions({
    ...discoveryModule.EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
    major: "경제학과",
    studentStage: "취업을 준비하는 중",
    goal: "취업·직무 조언 받기",
    secondaryMajorType: "부전공",
    secondaryMajor: "소프트웨어학과",
    careerConcerns: ["취업시장·전망", "필요한 역량·포트폴리오"],
    careerInterests: ["데이터·AI 직무"],
    careerGoal: "민간기업 취업",
    meetingSituation: "오피스아워",
    preferredSupport: "진로 경험과 준비법을 듣고 싶어요",
    experience: "통계 수업 경험",
    additionalContext: "코딩 경험이 적어요",
  }, "산업조직론");

  assert.equal(questions.length, 3);
  assert.match(questions[0], /취업을 준비하는 중/);
  assert.match(questions[0], /취업·직무 조언 받기/);
  assert.match(questions[0], /취업시장·전망/);
  assert.match(questions[0], /필요한 역량·포트폴리오/);
  assert.match(questions[1], /주전공 ‘경제학과’/);
  assert.match(questions[1], /부전공 ‘소프트웨어학과’/);
  assert.match(questions[1], /데이터·AI 직무/);
  assert.match(questions[1], /민간기업 취업/);
  assert.match(questions[2], /오피스아워/);
  assert.match(questions[2], /진로 경험과 준비법/);
  assert.match(questions[2], /통계 수업 경험/);
  assert.match(questions[2], /코딩 경험이 적어요/);

  const redactedQuestion = discoveryModule.buildProfessorContextQuestions({
    ...discoveryModule.EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
    major: "경제학과",
    careerConcerns: ["취업시장·전망"],
  }, "[redacted-phone] : 고효율 무선 전력 장치")[0];
  assert.doesNotMatch(redactedQuestion, /redacted/);
  assert.match(redactedQuestion, /고효율 무선 전력 장치/);
});
