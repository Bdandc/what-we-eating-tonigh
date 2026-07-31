import { redirect } from "next/navigation";

// The add-meal flow moved to /meals/add; keep old links and history working.
export default function LegacyAddMealPage() {
  redirect("/meals/add");
}
