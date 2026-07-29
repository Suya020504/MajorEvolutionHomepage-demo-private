import { NextResponse } from "next/server";
import { matchOfficialProfessors } from "@/lib/professor-data.server";
import {
  PROFESSOR_MATCH_POLICY,
  SUPPORTED_PROFESSOR_UNIVERSITY,
  type ProfessorMatchTopic,
} from "@/lib/professor-domain";

const MAX_BODY_BYTES = 12_000;

function stringValue(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function stringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((item) => stringValue(item, maxLength))
    .filter(Boolean);
}

function normalizeTopic(value: unknown): ProfessorMatchTopic | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const topic: ProfessorMatchTopic = {
    id: stringValue(raw.id, 100),
    title: stringValue(raw.title, 160),
    question: stringValue(raw.question, 260),
    methodDetail: stringValue(raw.methodDetail, 260),
    scope: stringValue(raw.scope, 220),
    interests: stringArray(raw.interests, 3, 60),
    methods: stringArray(raw.methods, 5, 80),
    major: stringValue(raw.major, 80),
    university: stringValue(raw.university, 80),
    goal: stringValue(raw.goal, 120),
    careerGoal: stringValue(raw.careerGoal, 160),
    meetingSituation: stringValue(raw.meetingSituation, 120),
    additionalContext: stringValue(raw.additionalContext, 300),
  };
  return topic.id && topic.title && topic.question ? topic : null;
}

function isDankookUniversity(value: string): boolean {
  const normalized = value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
  return new Set([
    "단국대",
    "단국대학교",
    "dankook",
    "dankookuniversity",
  ]).has(normalized);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "요청 데이터가 너무 큽니다." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식을 확인해 주세요." }, { status: 400 });
  }
  const raw = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null;
  const topic = normalizeTopic(raw?.topic);
  if (!topic) {
    return NextResponse.json({ error: "선택한 연구주제 정보가 부족합니다." }, { status: 400 });
  }
  const university = stringValue(raw?.university, 80) || topic.university || "";
  if (!university) {
    return NextResponse.json(
      {
        code: "UNIVERSITY_REQUIRED",
        error: "교수님 연결에 사용할 학교를 먼저 선택해 주세요.",
      },
      { status: 400 },
    );
  }
  if (!isDankookUniversity(university)) {
    return NextResponse.json(
      {
        code: "UNIVERSITY_OUT_OF_SCOPE",
        error: `현재 교수님 연결은 ${SUPPORTED_PROFESSOR_UNIVERSITY} 공식 데이터 파일럿만 지원합니다.`,
      },
      { status: 422 },
    );
  }
  topic.university = SUPPORTED_PROFESSOR_UNIVERSITY;
  // 학생이 거절한 교수는 다시 찾을 때 후보에서 뺍니다.
  const excludeIds = stringArray(raw?.excludeIds, 20, 64);

  return NextResponse.json(matchOfficialProfessors(topic, { excludeIds }), {
    headers: {
      "Cache-Control": "no-store",
      "X-Professor-Match-Policy": PROFESSOR_MATCH_POLICY,
    },
  });
}
