import { BottomNav } from "@/components/app/BottomNav";
import { RegisterSW } from "@/components/app/RegisterSW";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="min-h-dvh bg-creme pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {children}
      <BottomNav />
      <RegisterSW />
    </div>
  );
}
