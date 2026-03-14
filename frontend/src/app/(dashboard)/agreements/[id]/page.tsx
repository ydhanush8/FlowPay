"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { format } from "date-fns";
import { ArrowLeft, ShieldCheck, User, ExternalLink, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AgreementDetailPage() {
  const { id } = useParams();
  const { userId } = useAuth();
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgreement = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await axios.get(`${backendUrl}/api/agreements/${id}`);
      setAgreement(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAgreement();
  }, [id]);

  const handleConfirm = async (paymentId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      await axios.patch(`${backendUrl}/api/payments/confirm/${paymentId}`);
      toast.success("Payment marked as PAID");
      fetchAgreement(); // Refresh
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12 h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--fg)' }}></div>
    </div>
  );
  if (!agreement) return <div className="p-12 text-center" style={{ color: 'var(--muted)' }}>Agreement not found.</div>;

  const isPayer = agreement.payerId === userId;

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="space-y-4">
          <Link href="/agreements" className="inline-flex items-center text-sm group transition-colors" style={{ color: 'var(--muted)' }}>
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
          </Link>
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--muted-strong)' }}>Agreement Detail</h2>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>{agreement.title}</h1>
          </div>
        </div>
        <div className="px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase flex items-center" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--muted-strong)' }}>
          <ShieldCheck className="h-3.5 w-3.5 mr-2" /> {agreement.status}
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-strong)' }}>Payment Schedule</h3>
            <div className="h-px w-full" style={{ background: 'var(--border-color)' }}></div>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)', background: 'var(--surface)' }}>
            {agreement.payments?.length === 0 ? (
              <div className="p-12 text-center italic" style={{ color: 'var(--muted)' }}>No installments yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      {["#", "Due Date", "Amount", "Status", "Action"].map((h, i) => (
                        <th key={h} className={`p-5 text-xs uppercase tracking-widest font-bold ${i === 4 ? 'text-right' : ''}`} style={{ color: 'var(--muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agreement.payments.map((payment: any, idx: number) => {
                      const isDue = payment.status === 'PENDING' || payment.status === 'LATE';
                      return (
                        <tr key={payment.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td className="p-5 text-sm font-medium" style={{ color: 'var(--muted-strong)' }}>{idx + 1}</td>
                          <td className="p-5 text-sm font-semibold" style={{ color: 'var(--fg)' }}>{format(new Date(payment.dueDate), "MMM dd, yyyy")}</td>
                          <td className="p-5 text-sm font-bold" style={{ color: 'var(--fg)' }}>₹{payment.amount}</td>
                          <td className="p-5">
                            <span className="text-xs px-3 py-1 font-bold tracking-wider uppercase rounded-md" style={{ background: payment.status === 'PAID' ? 'var(--accent)' : 'transparent', color: payment.status === 'PAID' ? 'var(--accent-fg)' : 'var(--fg)', border: payment.status === 'PAID' ? 'none' : '1px solid var(--border-color)' }}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {isDue && isPayer && (
                                <button 
                                  onClick={() => window.open(agreement.paymentLink || "#", "_blank")}
                                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center"
                                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                                >
                                  Pay <ExternalLink className="h-3.5 w-3.5 ml-2" />
                                </button>
                              )}
                              {isDue && (
                                <button 
                                  onClick={() => handleConfirm(payment.id)}
                                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all flex items-center"
                                  style={{ borderColor: 'var(--border-color)', color: 'var(--fg)' }}
                                >
                                  Mark Paid
                                </button>
                              )}
                              {payment.status === 'PAID' && <div className="flex items-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Finalized <CheckCircle className="h-3.5 w-3.5 ml-2" /></div>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-8">
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-strong)' }}>Contract Details</h3>
          <div className="p-8 rounded-lg space-y-8" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Amount</label>
              <div className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>₹{agreement.amount} <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>/ {agreement.frequency.toLowerCase()}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Start Date</label>
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{format(new Date(agreement.startDate), "MMM dd, yyyy")}</div>
              </div>
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Role</label>
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{isPayer ? "Originator" : "Beneficiary"}</div>
              </div>
            </div>
            {agreement.rules && (
              <div className="pt-6 space-y-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Rules</label>
                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--muted-strong)' }}>&ldquo;{agreement.rules}&rdquo;</p>
              </div>
            )}
            <div className="pt-6 space-y-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="flex items-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                <User className="h-3.5 w-3.5 mr-3" /> Counterparty
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                <div className="text-sm font-bold truncate" style={{ color: 'var(--fg)' }}>
                  {isPayer ? (agreement.receiver?.name || agreement.receiver?.email || "Pending") : (agreement.payer?.name || agreement.payer?.email)}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
