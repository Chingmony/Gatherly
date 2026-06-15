import { QrCode, Radio, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthThemeToggle } from "./auth-ui";

/** Marketing bullets for the brand panel (design Auth left rail). */
const FEATURES = [
  { icon: ShieldCheck, title: "Role-based access", desc: "Admin · Sub-admin · Handler tiers" },
  { icon: QrCode, title: "Instant QR ticketing", desc: "Issued the moment guests register" },
  { icon: Radio, title: "Live event control", desc: "Real-time attendance & task health" },
];

/** Two-pane auth shell (design Auth): a gradient brand rail beside the form column. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on small screens */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
        style={{ background: "linear-gradient(155deg, #5b63f0 0%, #7c5cf0 38%, #3aa89f 78%, #43c97d 100%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(560px 280px at 80% -5%, rgba(255,255,255,.22), transparent 70%), repeating-linear-gradient(125deg, rgba(255,255,255,.06) 0 1px, transparent 1px 16px)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <Logo size={26} showText={false} />
          <span className="text-[20px] font-extrabold tracking-[-0.01em]">Gatherly</span>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Every event, perfectly coordinated.
          </h1>
          <p className="mt-4 max-w-sm text-[14px] font-medium leading-relaxed text-white/80">
            From draft to doors-open: registrations, QR check-in, crew tasks and live oversight — all in one console.
          </p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-center gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-white/15 backdrop-blur">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-bold">{f.title}</p>
                  <p className="text-[12.5px] font-medium text-white/75">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] font-medium text-white/70">© 2026 Gatherly · Secured with JWT</p>
      </aside>

      {/* Form panel */}
      <div className="relative flex items-center justify-center bg-[var(--bg)] px-6 py-12">
        <div className="absolute right-5 top-5">
          <AuthThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">
          {/* Brand lockup for mobile, where the panel is hidden */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <Logo size={28} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
