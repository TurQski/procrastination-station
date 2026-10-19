import { GoalDetail } from "@/components/dashboard";
import { idSchema } from "@/lib/validation";
import { notFound } from "next/navigation";
export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  return <GoalDetail key={id} id={id} />;
}
