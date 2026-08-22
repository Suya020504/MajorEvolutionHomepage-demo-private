import type { Metadata } from "next";
import { ResearchTutorialScreen } from "@/components/tutorial/research-tutorial-screen";

export const metadata: Metadata = {
  title: "전공 아이디어 튜토리얼 | 너의 교수님은?",
  description: "전공과 관심, 경험, 가능한 조건을 한 단계씩 정리하고 아이디어 공동설계를 시작하세요.",
};

export default function ResearchTutorialPage() {
  return <ResearchTutorialScreen />;
}
