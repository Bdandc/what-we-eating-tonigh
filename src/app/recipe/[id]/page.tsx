import { RecipeScreen } from "@/components/recipe-screen";

export const dynamic = "force-dynamic";

/**
 * Server wrapper: reads params and searchParams here and passes plain props
 * down, so the client screen never calls useSearchParams (which would demand
 * a Suspense boundary at build time). The `from` value maps through a FIXED
 * allowlist; nothing user-supplied ever becomes a navigation target.
 */
const BACK_TARGETS: Record<string, string> = { meals: "/meals" };

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref =
    typeof from === "string" && Object.hasOwn(BACK_TARGETS, from)
      ? BACK_TARGETS[from]
      : "/";
  return <RecipeScreen key={id} mealId={id} backHref={backHref} />;
}
