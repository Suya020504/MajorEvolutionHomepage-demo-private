/**
 * 화면 표시가 승인된 단국대학교 공식 교수 사진만 등록하는 장부입니다.
 *
 * 기존 Obsidian 장부의 623건은 모두
 * `REFERENCE_ONLY_PERMISSION_UNVERIFIED` 상태이므로 이 파일에 옮기지 않습니다.
 * 학교 또는 권리자의 표시 허가가 확인된 뒤에만 아래 계약으로 추가합니다.
 *
 * 외부 사진 URL을 직접 연결(핫링크)하지 않습니다. 승인된 이미지는
 * `public/official-professor-photos/`에 최적화한 사본으로 보관하고, 출처 페이지와
 * 확인일을 함께 기록해야 합니다.
 */

export type ApprovedProfessorPhotoReference = {
  professorId: string;
  professorName: string;
  imageSrc: `/official-professor-photos/${string}`;
  officialProfileUrl: `https://${string}`;
  sourcePageUrl: `https://${string}`;
  checkedAt: string;
  usageStatus: "APPROVED_FOR_DISPLAY";
};

export const approvedProfessorPhotoReferences: Readonly<
  Record<string, ApprovedProfessorPhotoReference>
> = Object.freeze({});
