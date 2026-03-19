import { AuthPanel } from "@/components/AuthPanel";
import { colors } from "@/theme/colors";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: colors.backgroundMuted }}>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl">
          <AuthPanel />
        </div>
      </div>
    </main>
  );
}
