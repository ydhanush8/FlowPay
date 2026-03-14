"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { format } from "date-fns";
import { History, ShieldCheck, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentsHistoryPage() {
  const { userId } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    if (!userId) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await axios.get(`${backendUrl}/api/payments/user/${userId}`);
      // Sort soonest first for better UX
      const sorted = res.data.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setPayments(sorted);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPayments();
  }, [userId]);

  const handleConfirm = async (paymentId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      await axios.patch(`${backendUrl}/api/payments/confirm/${paymentId}`);
      toast.success("Payment marked as PAID");
      fetchPayments();
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12 h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--fg)' }}></div>
    </div>
  );

  return (
    <div className="p-8 md:p-12 space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--muted-strong)' }}>Settlement Ledger</h2>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Payment History</h1>
        </div>
      </header>

      {payments.length === 0 ? (
        <div className="p-20 text-center rounded-lg" style={{ border: '1px dashed var(--border-color)' }}>
          <History className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--muted)' }} />
          <p style={{ color: 'var(--muted)' }}>No settlement history found.</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <div className="hidden lg:grid grid-cols-6 p-5 px-6" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-color)' }}>
            {["Agreement", "Role", "Amount", "Due Date", "Status", "Action"].map((h, i) => (
              <span key={h} className={`text-xs font-bold uppercase tracking-widest ${i === 5 ? 'text-right' : i > 0 ? 'text-center' : ''}`} style={{ color: 'var(--muted)' }}>{h}</span>
            ))}
          </div>
          <div>
            {payments.map((payment) => {
              const isPayer = payment.agreement.payerId === userId;
              const isDue = payment.status === 'PENDING' || payment.status === 'LATE';
              return (
                <div key={payment.id} className="grid grid-cols-1 lg:grid-cols-6 items-center p-6 gap-4 transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className="space-y-1">
                    <div className="font-bold uppercase tracking-tight" style={{ color: 'var(--fg)' }}>{payment.agreement.title}</div>
                    <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>ID: {payment.agreement.id.slice(0, 8)}</div>
                  </div>
                  <div className="text-center">
                    <span className="px-3 py-1 text-xs font-bold tracking-wider rounded-md" style={{ background: isPayer ? 'var(--accent)' : 'transparent', color: isPayer ? 'var(--accent-fg)' : 'var(--muted-strong)', border: isPayer ? 'none' : '1px solid var(--border-color)' }}>
                      {isPayer ? "ORIGINATOR" : "BENEFICIARY"}
                    </span>
                  </div>
                  <div className="text-center font-bold text-lg" style={{ color: 'var(--fg)' }}>₹{payment.amount}</div>
                  <div className="text-center text-sm font-semibold" style={{ color: 'var(--muted-strong)' }}>{format(new Date(payment.dueDate), "MMM dd, yyyy")}</div>
                  <div className="text-center">
                    <span className="text-xs px-3 py-1 font-bold tracking-wider rounded-md" style={{ background: payment.status === 'PAID' ? 'var(--accent)' : 'transparent', color: payment.status === 'PAID' ? 'var(--accent-fg)' : 'var(--fg)', border: payment.status === 'PAID' ? 'none' : '1px solid var(--border-color)' }}>
                      {payment.status}
                    </span>
                  </div>
                  <td className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {isDue && isPayer && (
                        <button 
                          onClick={() => window.open(payment.agreement.paymentLink || "#", "_blank")}
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
                          Confirm
                        </button>
                      )}
                      {payment.status === 'PAID' && <div className="flex items-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Resolved <CheckCircle className="h-3.5 w-3.5 ml-2" /></div>}
                    </div>
                  </td>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
