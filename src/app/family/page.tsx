"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  type AppState,
  appSurface,
  loadInitialState,
  mealLookup,
  memberColors,
  slugify,
  storageKey,
  todayStamp,
} from "@/lib/dinner-state";

export default function FamilyPage() {
  const [appState, setAppState] = useState<AppState>(loadInitialState);
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberColor, setMemberColor] = useState(memberColors[0]);

  const lookup = useMemo(() => mealLookup(appState), [appState]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(appState));
  }, [appState]);

  function addFamilyMember() {
    const trimmedName = memberName.trim();
    const trimmedRole = memberRole.trim();

    if (!trimmedName) return;

    const baseId = slugify(trimmedName) || `member-${Date.now()}`;
    let nextId = baseId;
    let counter = 2;

    while (appState.familyMembers.some((m) => m.id === nextId)) {
      nextId = `${baseId}-${counter}`;
      counter += 1;
    }

    startTransition(() => {
      setAppState((current) => ({
        ...current,
        lastUpdated: todayStamp(),
        familyMembers: [
          ...current.familyMembers,
          { id: nextId, name: trimmedName, role: trimmedRole || "Family", color: memberColor },
        ],
      }));
    });

    setMemberName("");
    setMemberRole("");
    setMemberColor(memberColors[(memberColors.indexOf(memberColor) + 1) % memberColors.length]);
  }

  function removeMember(memberId: string) {
    startTransition(() => {
      setAppState((current) => ({
        ...current,
        lastUpdated: todayStamp(),
        familyMembers: current.familyMembers.filter((m) => m.id !== memberId),
      }));
    });
  }

  return (
    <div className="min-h-screen pb-28 text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 sm:px-6">

        {/* Back nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition motion-safe:hover:-translate-x-0.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to planner
        </Link>

        {/* Header */}
        <header className={cn(appSurface(), "p-7")}>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">Your household</p>
          <h1 className="font-display text-4xl leading-none sm:text-5xl">Family</h1>
          <p className="mt-3 text-base leading-7 text-muted">Add the people in your household so you can track who likes what.</p>
        </header>

        {/* Add member form */}
        <section className={cn(appSurface(true), "p-6")}>
          <h2 className="mb-5 font-display text-2xl leading-none">Add a member</h2>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-accent-deep">
              Name
              <input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Ella"
                onKeyDown={(e) => e.key === "Enter" && addFamilyMember()}
                className="h-12 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-accent-deep">
              Role
              <input
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                placeholder="Daughter"
                onKeyDown={(e) => e.key === "Enter" && addFamilyMember()}
                className="h-12 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1"
              />
            </label>
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-accent-deep">Pick a colour</p>
              <div className="flex flex-wrap gap-3">
                {memberColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setMemberColor(color)}
                    className={cn("h-10 w-10 rounded-full border-2 transition", memberColor === color ? "border-foreground scale-110" : "border-transparent")}
                    style={{ backgroundColor: color }}
                    aria-label={`Select colour ${color}`}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={addFamilyMember}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#2f2419] px-5 text-sm font-semibold text-[#fff8f3] transition motion-safe:hover:-translate-y-0.5"
            >
              Add to family
            </button>
          </div>
        </section>

        {/* Member list */}
        <section className={cn(appSurface(), "p-6")}>
          <h2 className="mb-5 font-display text-2xl leading-none">Members</h2>
          {appState.familyMembers.length === 0 ? (
            <p className="text-sm text-muted">No members yet. Add someone above.</p>
          ) : (
            <div className="grid gap-3">
              {appState.familyMembers.map((member) => {
                const favoriteMealNames = Object.entries(appState.mealLikes)
                  .filter(([, memberIds]) => memberIds.includes(member.id))
                  .map(([mealId]) => lookup.family[mealId]?.name ?? lookup.kids[mealId]?.name)
                  .filter(Boolean)
                  .slice(0, 4);

                return (
                  <article key={member.id} className="rounded-[18px] border border-[rgba(103,73,44,0.08)] bg-white/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name[0]}
                        </span>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-muted">{member.role}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="rounded-full bg-[rgba(103,73,44,0.08)] px-3 py-2 text-xs font-semibold text-foreground transition motion-safe:hover:-translate-y-0.5"
                      >
                        Remove
                      </button>
                    </div>
                    {favoriteMealNames.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {favoriteMealNames.map((mealName) => (
                          <span
                            key={`${member.id}-${mealName}`}
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{ backgroundColor: `${member.color}1f`, color: member.color }}
                          >
                            {mealName}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
