import type { Metadata } from "next";
import { ConditionSelectScreen } from "@/components/screens/research-condition";

export const metadata: Metadata = {
  title: "프로젝트 조건 수정 | 너의 교수님은?",
  description: "저장된 전공·관심·경험·기간·자료 조건을 한눈에 확인하고 수정합니다.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const params = await searchParams;
  const view = Array.isArray(params.view) ? params.view[0] : params.view;
  return <ConditionSelectScreen initialStep={view === "review" ? "review" : "direction"} />;
}
