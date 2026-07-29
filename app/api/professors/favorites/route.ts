import { NextResponse } from "next/server";
import { getOfficialProfessorById } from "@/lib/professor-data.server";
import type {
  FavoriteProfessorPaperCatalog,
  FavoriteProfessorPaperCatalogResponse,
} from "@/lib/professor-domain";
import { MAX_FAVORITE_PROFESSORS } from "@/lib/professor-paper-selection";

const MAX_BODY_BYTES = 4_000;
const MAX_ID_LENGTH = 64;

function normalizeProfessorIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(
    value
      .slice(0, MAX_FAVORITE_PROFESSORS)
      .map((item) => typeof item === "string" ? item.trim().slice(0, MAX_ID_LENGTH) : "")
      .filter(Boolean),
  ));
}

function toPaperCatalog(professorId: string): FavoriteProfessorPaperCatalog | null {
  const professor = getOfficialProfessorById(professorId);
  if (!professor) return null;
  return {
    id: professor.id,
    university: professor.university,
    college: professor.college,
    department: professor.department,
    name: professor.name,
    title: professor.title,
    publications: professor.publications,
    publicationCount: professor.publicationCount,
    publicationsStatus: professor.publicationsStatus,
    officialProfileUrl: professor.officialProfileUrl,
  };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "즐겨찾기 요청 데이터가 너무 큽니다." }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "즐겨찾기 요청 데이터가 너무 큽니다." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "요청 형식을 확인해 주세요." }, { status: 400 });
  }
  const raw = body && typeof body === "object" && !Array.isArray(body)
    ? body as Record<string, unknown>
    : null;
  const professorIds = normalizeProfessorIds(raw?.professorIds);
  if (professorIds.length === 0) {
    return NextResponse.json(
      { error: "즐겨찾는 교수님을 한 명 이상 선택해 주세요." },
      { status: 400 },
    );
  }

  const professors: FavoriteProfessorPaperCatalog[] = [];
  const missingProfessorIds: string[] = [];
  professorIds.forEach((professorId) => {
    const professor = toPaperCatalog(professorId);
    if (professor) professors.push(professor);
    else missingProfessorIds.push(professorId);
  });

  const response: FavoriteProfessorPaperCatalogResponse = {
    professors,
    missingProfessorIds,
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Professor-Data-Source": "DANKOOK_OFFICIAL_PROFILE",
    },
  });
}
