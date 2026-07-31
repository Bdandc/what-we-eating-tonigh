import { MealFormScreen } from "@/components/meal-form-screen";

export const dynamic = "force-dynamic";

export default async function EditMealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MealFormScreen mealId={id} />;
}
