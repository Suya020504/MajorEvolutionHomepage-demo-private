import { AppShell, PageHeader } from "@/components/app/primitives";
import { DataControls } from "@/components/screens/data-controls";

export default function Page() {
  return (
    <AppShell title="내 기록 관리" backHref="/portfolio" className="portfolio-screen">
      <PageHeader
        title="내 기록 관리"
        description="종류별로 저장 범위를 확인하고, 필요할 때만 직접 삭제할 수 있어요."
      />
      <DataControls showHeading={false} />
    </AppShell>
  );
}
