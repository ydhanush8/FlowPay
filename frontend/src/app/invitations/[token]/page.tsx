"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import axios from "axios";
import { format } from "date-fns";
import { ShieldCheck, Info } from "lucide-react";

export default function InvitationPage() {
  const { token } = useParams();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const res = await axios.get(`${backendUrl}/api/invitations/${token}`);
        setInvitation(res.data);
      } catch (err) {
        console.error(err);
        setError("Invalid invitation token or record not found.");
      } finally { setLoading(false); }
    };
    if (token) fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!userId) return;
    try {
      setAccepting(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      await axios.post(`${backendUrl}/api/invitations/${token}/accept`, { receiverId: userId });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error accepting invitation.");
      setAccepting(false);
    }
  };

  if (loading || !isLoaded) return (
    <div className="flex items-center justify-center p-12 h-screen" style={{ background: 'var(--bg)' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--fg)' }}></div>
    </div>
  );

  if (error || !invitation) return (
    <div className="p-12 h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="p-12 rounded-lg text-center max-w-md space-y-4" style={{ border: '1px solid var(--border-color)' }}>
        <Info className="h-10 w-10 mx-auto" style={{ color: 'var(--muted)' }} />
        <h2 className="text-xl font-bold uppercase tracking-tight">Access Denied</h2>
        <p style={{ color: 'var(--muted)' }}>{error}</p>
      </div>
    </div>
  );

  if (invitation.status !== 'PENDING') return (
    <div className="p-12 h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="p-12 rounded-lg text-center max-w-md space-y-6" style={{ border: '1px solid var(--border-color)' }}>
        <ShieldCheck className="h-12 w-12 mx-auto" style={{ color: 'var(--muted)' }} />
        <h2 className="text-2xl font-bold uppercase tracking-tight">Agreement {invitation.status}</h2>
        <p className="italic" style={{ color: 'var(--muted)' }}>This invitation has already been resolved.</p>
        <button onClick={() => router.push('/dashboard')} className="px-8 py-3 font-bold rounded-lg text-sm uppercase tracking-widest transition-all cursor-pointer" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  const agr = invitation.agreement;

  return (
    <div className="min-h-screen p-6 md:p-12 lg:p-24 flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.4em]" style={{ color: 'var(--muted-strong)' }}>Invitation to Participate</h2>
            <h1 className="text-5xl font-bold tracking-tighter leading-none" style={{ color: 'var(--fg)' }}>Execute Your Agreement.</h1>
            <p className="text-lg leading-relaxed pt-4" style={{ color: 'var(--muted)' }}>
              <span className="font-medium" style={{ color: 'var(--fg)' }}>{invitation.sender?.name || invitation.sender?.email || "An originator"}</span> has invited you to a recurring settlement schedule.
            </p>
          </div>
          <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            {["Verifiable payment schedules", "Automated compliance & reminders"].map((t) => (
              <div key={t} className="flex items-center text-xs space-x-4">
                <ShieldCheck className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                <span style={{ color: 'var(--muted-strong)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-10 rounded-lg space-y-10" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Title</label>
              <div className="text-xl font-bold tracking-tight uppercase" style={{ color: 'var(--fg)' }}>{agr.title}</div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Amount</label>
                <div className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>₹{agr.amount}</div>
                <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Per {agr.frequency.toLowerCase()}</div>
              </div>
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Start Date</label>
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{format(new Date(agr.startDate), "MMM dd, yyyy")}</div>
              </div>
            </div>
            {agr.rules && (
              <div className="pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--muted)' }}>Rules</label>
                <div className="text-xs italic leading-relaxed p-4 rounded-lg" style={{ color: 'var(--muted-strong)', background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                  &ldquo;{agr.rules}&rdquo;
                </div>
              </div>
            )}
          </div>

          <div className="pt-8" style={{ borderTop: '1px solid var(--border-color)' }}>
            {!isSignedIn ? (
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-widest text-center" style={{ color: 'var(--muted)' }}>Auth required to proceed</p>
                <SignInButton mode="modal" forceRedirectUrl={`/invitations/${token}`}>
                  <button className="w-full py-4 font-bold rounded-lg transition-all duration-300 cursor-pointer" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                    Sign In to Accept
                  </button>
                </SignInButton>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>By accepting, you activate the settlement</p>
                <button onClick={handleAccept} disabled={accepting} className="w-full py-4 font-bold rounded-lg transition-all duration-300 disabled:opacity-50 cursor-pointer" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                  {accepting ? "INITIALIZING..." : "ACCEPT & ACTIVATE"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
