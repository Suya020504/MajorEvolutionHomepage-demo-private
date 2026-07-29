import {
  approvedProfessorPhotoReferences,
  type ApprovedProfessorPhotoReference,
} from "@/data/professor-photo-references";
import { professorCharacter } from "@/lib/brand-assets";

export type ProfessorPortraitVariant = "TOPIC" | "METHOD" | "CONTEXT" | "PROFILE";

export type ProfessorPortrait =
  | {
      kind: "OFFICIAL_PROFILE_PHOTO";
      src: ApprovedProfessorPhotoReference["imageSrc"];
      alt: string;
      badgeLabel: "공식 프로필 사진";
      sourceLabel: "단국대학교 공식 프로필";
      sourceHref: string;
      checkedAt: string;
      isActualProfessorPhoto: true;
    }
  | {
      kind: "BRAND_ILLUSTRATION";
      src: (typeof professorCharacter)[keyof typeof professorCharacter];
      alt: string;
      badgeLabel: "브랜드 일러스트";
      sourceLabel: "실제 교수 사진 미사용";
      sourceHref: null;
      checkedAt: null;
      isActualProfessorPhoto: false;
    };

const OFFICIAL_DKU_HOSTS = new Set([
  "dankook.ac.kr",
  "www.dankook.ac.kr",
  "cms.dankook.ac.kr",
  "portal.dankook.ac.kr",
  "webinfo.dankook.ac.kr",
]);

const FALLBACK_BY_VARIANT = {
  TOPIC: professorCharacter.topic,
  METHOD: professorCharacter.method,
  CONTEXT: professorCharacter.perspective,
  PROFILE: professorCharacter.profile,
} as const satisfies Record<ProfessorPortraitVariant, string>;

function isOfficialDankookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && OFFICIAL_DKU_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function isDisplaySafeReference(
  reference: ApprovedProfessorPhotoReference,
  professorId: string,
  professorName: string,
): boolean {
  return (
    reference.professorId === professorId &&
    reference.professorName.trim() === professorName.trim() &&
    reference.usageStatus === "APPROVED_FOR_DISPLAY" &&
    reference.imageSrc.startsWith("/official-professor-photos/") &&
    isOfficialDankookUrl(reference.officialProfileUrl) &&
    isOfficialDankookUrl(reference.sourcePageUrl)
  );
}

/**
 * 교수 추천 카드와 상세 화면에서 사용할 이미지를 결정합니다.
 *
 * 승인 장부에 유효한 공식 사진이 있을 때만 실제 사진을 반환합니다. 그 외에는
 * 언제나 브랜드 일러스트를 반환하므로, 권리 미확인 URL이나 외부 인용 사이트
 * 이미지를 화면에 노출하지 않습니다.
 */
export function resolveProfessorPortrait({
  professorId,
  professorName,
  variant = "PROFILE",
}: {
  professorId: string;
  professorName: string;
  variant?: ProfessorPortraitVariant;
}): ProfessorPortrait {
  const reference = approvedProfessorPhotoReferences[professorId];

  if (reference && isDisplaySafeReference(reference, professorId, professorName)) {
    return {
      kind: "OFFICIAL_PROFILE_PHOTO",
      src: reference.imageSrc,
      alt: `${professorName} 교수 공식 프로필 사진`,
      badgeLabel: "공식 프로필 사진",
      sourceLabel: "단국대학교 공식 프로필",
      sourceHref: reference.sourcePageUrl,
      checkedAt: reference.checkedAt,
      isActualProfessorPhoto: true,
    };
  }

  return {
    kind: "BRAND_ILLUSTRATION",
    src: FALLBACK_BY_VARIANT[variant],
    alt: `${professorName} 교수의 실제 사진이 아닌 브랜드 교수 일러스트`,
    badgeLabel: "브랜드 일러스트",
    sourceLabel: "실제 교수 사진 미사용",
    sourceHref: null,
    checkedAt: null,
    isActualProfessorPhoto: false,
  };
}
