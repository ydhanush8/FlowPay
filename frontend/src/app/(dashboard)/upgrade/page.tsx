"use client";

import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { CheckCircle2, Sparkles, Shield, Rocket, ArrowRight } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (planType: 'MONTHLY' | 'YEARLY') => {
    setLoading(planType);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      
      // Initialize subscription on backend
      const { data } = await axios.post(`${backendUrl}/api/payments/create-subscription`, {
        userId,
        planType
      });

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "FlowPay Pro",
        description: `${planType === 'YEARLY' ? 'Yearly' : 'Monthly'} Pro Subscription`,
        handler: function (response: any) {
          toast.success("Payment successful! Your plan is being updated.");
          // We wait for webhook, but can also redirect immediately
          setTimeout(() => router.push("/dashboard"), 3000);
        },
        prefill: {
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || ""
        },
        theme: {
          color: "#000000"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Failed to initialize upgrade");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="max-w-5xl mx-auto space-y-16">
        <header className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase italic">Elevate Your Business</h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
            The Free plan is for starters. Pro is for those who mean business.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Free Plan */}
          <div className="p-10 rounded-2xl flex flex-col justify-between" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted-strong)' }}>Standard</h3>
                <div className="text-4xl font-bold">Free</div>
              </div>
              <ul className="space-y-4">
                {[
                  "Up to 2 Agreements",
                  "Automated Payment Schedules",
                  "External Payment Links",
                  "Manual Status Tracking",
                  "Basic Dashboard"
                ].map((f) => (
                  <li key={f} className="flex items-center text-sm space-x-3">
                    <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                    <span style={{ color: 'var(--fg)' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button disabled className="mt-10 w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs opacity-50 cursor-not-allowed" style={{ background: 'var(--border-color)', color: 'var(--muted)' }}>
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="p-10 rounded-2xl relative overflow-hidden flex flex-col justify-between" 
               style={{ background: 'var(--fg)', color: 'var(--bg)', border: '1px solid var(--fg)' }}>
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="h-12 w-12 opacity-10" />
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ opacity: 0.6 }}>Professional</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>Recommended</span>
                </div>
                <div className="text-4xl font-bold">₹199 / mo</div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ opacity: 0.5 }}>or ₹1999 billed yearly (SAVE 20%)</p>
              </div>
              <ul className="space-y-4">
                {[
                  "Unlimited Agreements",
                  "Priority Reminders",
                  "Early Access Features",
                  "Advanced Analytics",
                  "Dedicated Support",
                  "Custom Branding (Soon)"
                ].map((f) => (
                  <li key={f} className="flex items-center text-sm space-x-3">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4">
              <button 
                onClick={() => handleUpgrade('MONTHLY')}
                disabled={!!loading}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ background: 'var(--bg)', color: 'var(--fg)' }}
              >
                {loading === 'MONTHLY' ? "Initializing..." : "Get Monthly Pro"}
              </button>
              <button 
                onClick={() => handleUpgrade('YEARLY')}
                disabled={!!loading}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--bg)' }}
              >
                {loading === 'YEARLY' ? "Initializing..." : "Get Yearly Pro (₹1999)"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <section className="grid md:grid-cols-3 gap-12 pt-12" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="space-y-4">
            <Shield className="h-6 w-6" style={{ color: 'var(--muted)' }} />
            <h4 className="font-bold uppercase tracking-widest text-sm">Cancel Anytime</h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>No lock-ins. Manage your subscription directly through your dashboard with one click.</p>
          </div>
          <div className="space-y-4">
            <Rocket className="h-6 w-6" style={{ color: 'var(--muted)' }} />
            <h4 className="font-bold uppercase tracking-widest text-sm">Instant Access</h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Agreement limits are lifted immediately upon successful payment confirmation.</p>
          </div>
          <div className="space-y-4">
            <Shield className="h-6 w-6" style={{ color: 'var(--muted)' }} />
            <h4 className="font-bold uppercase tracking-widest text-sm">Secure Checkout</h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Encrypted transactions processed securely via Razorpay, India's leading payment gateway.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
