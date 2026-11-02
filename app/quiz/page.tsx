import type { Metadata } from "next";
import { QuizClient } from "./QuizClient";

export const metadata: Metadata = { title: "Ton plan en 2 minutes", robots: { index: false } };

export default function QuizPage() {
  return <QuizClient />;
}
