"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { KEYS, writeSession } from "@/lib/client/storage";

/** Recharge les réponses du quiz dans le navigateur puis ouvre le plan. */
export function ResumeClient({ quizId, answers }: { quizId: string; answers: unknown }) {
  const router = useRouter();
  useEffect(() => {
    writeSession(KEYS.quiz, { quizId, answers });
    router.replace("/plan");
  }, [quizId, answers, router]);
  return <p className="wrap pt-16 text-center text-lg font-semibold">On récupère ton plan…</p>;
}
