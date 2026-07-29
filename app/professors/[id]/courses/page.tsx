import { notFound } from "next/navigation";
import { OfficialCoursesScreen } from "@/components/screens/official-courses-screen";
import { getOfficialProfessorById } from "@/lib/professor-data.server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const professor = getOfficialProfessorById(id);
  if (!professor) notFound();
  return <OfficialCoursesScreen professor={professor} />;
}
