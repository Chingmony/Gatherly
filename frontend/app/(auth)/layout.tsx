export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span
            aria-hidden
            className="inline-block h-6 w-6 rounded-[8px]"
            style={{ background: "var(--ac)" }}
          />
          <span className="text-[20px] font-bold tracking-[-0.01em] text-[var(--t1)]">Gatherly</span>
        </div>
        {children}
      </div>
    </main>
  );
}
