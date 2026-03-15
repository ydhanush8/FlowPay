import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-12" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="space-y-6">
        <h1 className="text-7xl font-bold tracking-tighter sm:text-8xl uppercase italic" style={{ color: 'var(--fg)' }}>FlowPay</h1>
        <p className="text-xl max-w-2xl mx-auto leading-relaxed font-light" style={{ color: 'var(--muted)' }}>
          Redefining how parties establish and resolve obligations. Secure, automated, and minimal.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
        {userId ? (
          <Link
            href="/dashboard"
            className="px-10 py-4 font-bold rounded-lg border transition-all duration-300 text-lg"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)', borderColor: 'var(--accent)' }}
          >
            Enter Dashboard
          </Link>
        ) : (
          <>
            <SignInButton mode="modal">
              <button className="px-10 py-4 font-bold rounded-lg transition-all duration-300 text-lg border cursor-pointer" style={{ borderColor: 'var(--border-color)', color: 'var(--fg)' }}>
                Log In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-10 py-4 font-bold rounded-lg border transition-all duration-300 text-lg cursor-pointer" style={{ background: 'var(--accent)', color: 'var(--accent-fg)', borderColor: 'var(--accent)' }}>
                Start Creating
              </button>
            </SignUpButton>
          </>
        )}
      </div>

      <div className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl">
        {[
          { num: "01", title: "Automate", desc: "Dynamic payment schedules generated instantly upon validation." },
          { num: "02", title: "Synchronize", desc: "Daily automated validation for compliance and debt resolution." },
          { num: "03", title: "Resolve", desc: "Integrated settlement rails for immediate high-trust transactions." },
        ].map((item) => (
          <div key={item.num} className="space-y-4 group text-left">
            <div className="h-0.5 w-12 group-hover:w-full transition-all duration-500" style={{ background: 'var(--border-color)' }}></div>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--muted-strong)' }}>{item.num}. {item.title}</h3>
            <p className="font-light leading-relaxed" style={{ color: 'var(--muted-strong)' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
