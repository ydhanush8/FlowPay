"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { ArrowLeft, CheckCircle2, Info, Sparkles, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";

export default function CreateAgreementPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user: currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userPlan, setUserPlan] = useState<any>(null);
  const [agreementCount, setAgreementCount] = useState(0);
  const [isCheckingLimits, setIsCheckingLimits] = useState(true);

  useEffect(() => {
    const checkLimits = async () => {
      if (!userId) return;
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const [planRes, agrRes] = await Promise.all([
          axios.get(`${backendUrl}/api/payments/user-plan/${userId}`),
          axios.get(`${backendUrl}/api/agreements/user/${userId}`)
        ]);
        setUserPlan(planRes.data);
        // Only count agreements SENT by the user as the Payer
        setAgreementCount(agrRes.data.filter((a: any) => a.payerId === userId).length);
      } catch (err) {
        console.error("Limit check error", err);
      } finally {
        setIsCheckingLimits(false);
      }
    };
    checkLimits();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const agrRes = await axios.post(`${backendUrl}/api/agreements`, {
        title: data.title,
        description: data.description,
        amount: Number(data.amount),
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate || null,
        rules: data.rules,
        payerId: userId,
        payerEmail: currentUser?.primaryEmailAddress?.emailAddress,
        payerName: currentUser?.fullName,
        paymentLink: data.paymentLink
      });

      await axios.post(`${backendUrl}/api/invitations`, {
        agreementId: agrRes.data.id,
        senderId: userId,
        receiverEmail: data.receiverEmail,
      });

      toast.success("Agreement created and invitation sent!");
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to create agreement");
      toast.error("Failed to create agreement");
    } finally {
      setLoading(false);
    }
  };
  if (isCheckingLimits) {
    return (
      <div className="flex items-center justify-center p-12 h-screen" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--fg)' }}></div>
      </div>
    );
  }

  const isLimitReached = userPlan?.plan === 'FREE' && agreementCount >= 2;

  return (
    <div className="min-h-screen p-6 md:p-12" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between pb-8" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="space-y-1">
            <Link href="/dashboard" className="flex items-center text-sm mb-4 group transition-colors" style={{ color: 'var(--muted)' }}>
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold tracking-tight uppercase" style={{ color: 'var(--fg)' }}>New Agreement</h1>
            <p style={{ color: 'var(--muted)' }}>Establish terms and initialize the collection schedule.</p>
          </div>
          <div className="hidden md:block">
            <div className="px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase flex items-center" style={{ border: '1px solid var(--border-color)', color: 'var(--muted-strong)' }}>
              <span className="h-1.5 w-1.5 rounded-full mr-2" style={{ background: 'var(--muted)' }}></span> Draft Mode
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {error && (
              <div className="p-4 rounded-lg flex items-center" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--fg)' }}>
                <Info className="h-5 w-5 mr-3" /> {error}
              </div>
            )}

            {/* Section 1 */}
            <section className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-strong)' }}>01. Core Identity</h3>
                <div className="h-px w-full" style={{ background: 'var(--border-color)' }}></div>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-strong)' }}>Agreement Title</label>
                  <input name="title" required className="w-full bg-transparent border-0 border-b-2 rounded-none px-0 py-4 text-2xl font-semibold focus:outline-none transition-all" style={{ borderColor: 'var(--border-color)', color: 'var(--fg)' }} placeholder="E.g. Commercial Lease - Suite 402" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-strong)' }}>Receiver Email (Involved Party)</label>
                  <input name="receiverEmail" type="email" required className="w-full bg-transparent border-0 border-b-2 rounded-none px-0 py-4 text-lg focus:outline-none transition-all" style={{ borderColor: 'var(--border-color)', color: 'var(--fg)' }} placeholder="receiver@example.com" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-strong)' }}>Internal Description</label>
                  <textarea name="description" rows={2} className="w-full rounded-lg p-4 text-sm focus:outline-none transition-all resize-none" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--fg)' }} placeholder="Briefly describe the purpose..." />
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-strong)' }}>02. Financial Parameters</h3>
                <div className="h-px w-full" style={{ background: 'var(--border-color)' }}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-strong)' }}>Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-bold" style={{ color: 'var(--muted)' }}>₹</span>
                    <input name="amount" type="number" min="1" required className="w-full bg-transparent border-0 border-b-2 rounded-none pl-6 py-4 text-xl font-semibold focus:outline-none transition-all" style={{ borderColor: 'var(--border-color)', color: 'var(--fg)' }} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-strong)' }}>Frequency</label>
                  <select name="frequency" required className="w-full bg-transparent border-0 border-b-2 rounded-none px-0 py-4 text-lg font-semibold focus:outline-none transition-all appearance-none cursor-pointer" style={{ borderColor: 'var(--border-color)', color: 'var(--fg)' }}>
                    <option value="MONTHLY" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>Monthly</option>
                    <option value="WEEKLY" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>Weekly</option>
                    <option value="QUARTERLY" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>Quarterly</option>
                    <option value="YEARLY" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>Yearly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-strong)' }}>Start Date</label>
                  <input name="startDate" type="date" required className="w-full bg-transparent border-0 border-b-2 rounded-none px-0 py-4 font-semibold focus:outline-none transition-all" style={{ borderColor: 'var(--border-color)', color: 'var(--fg)', colorScheme: 'auto' }} />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-strong)' }}>End Date (Optional)</label>
                  <input name="endDate" type="date" className="w-full bg-transparent border-0 border-b-2 rounded-none px-0 py-4 font-semibold focus:outline-none transition-all" style={{ borderColor: 'var(--border-color)', color: 'var(--fg)', colorScheme: 'auto' }} />
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-strong)' }}>03. Legal & Distribution</h3>
                <div className="h-px w-full" style={{ background: 'var(--border-color)' }}></div>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-strong)' }}>Terms & Rules</label>
                  <textarea name="rules" rows={4} className="w-full rounded-lg p-4 text-sm focus:outline-none transition-all resize-none" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--fg)' }} placeholder="Define late fees, grace periods..." />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-strong)' }}>Payment Redirect Link (Receiver's Link)</label>
                  <input name="paymentLink" type="url" required className="w-full bg-transparent border-0 border-b-2 rounded-none px-0 py-4 text-lg font-semibold focus:outline-none transition-all" style={{ borderColor: 'var(--border-color)', color: 'var(--fg)' }} placeholder="https://rzp.io/l/your-link or UPI URL" />
                  <p className="text-[10px] uppercase tracking-widest leading-relaxed" style={{ color: 'var(--muted)' }}>The payer will be redirected to this external link for all installments.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 relative">
            {isLimitReached && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="space-y-4 p-8 rounded-xl border border-white/20 bg-black shadow-2xl">
                  <Lock className="h-10 w-10 mx-auto text-white" />
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Limit Reached</h3>
                  <p className="text-sm text-white/60 mb-4">Free accounts are limited to 2 agreements. Upgrade to Pro for unlimited access.</p>
                  <Link href="/upgrade" className="block w-full py-4 font-bold rounded-lg text-sm uppercase tracking-widest bg-white text-black transition-all hover:scale-105 active:scale-95">
                    Upgrade to Pro <Sparkles className="inline-flex h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            )}
            <div className="p-8 rounded-lg space-y-8 sticky top-12" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted-strong)' }}>Review Summary</h4>
              <div className="space-y-4">
                {["External secure settlement", "Automated schedule generation", "Instant redirection"].map((t) => (
                  <div key={t} className="flex items-center text-sm space-x-3">
                    <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                    <span style={{ color: 'var(--muted-strong)' }}>{t}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 space-y-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>By initializing this agreement, you authorize the generation of a recurring payment schedule.</p>
                <button type="submit" disabled={loading} className="w-full font-bold py-4 rounded-lg transition-all duration-300 disabled:opacity-50 text-sm uppercase tracking-wider cursor-pointer" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                  {loading ? "Initializing..." : "Publish & Invite"}
                </button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
