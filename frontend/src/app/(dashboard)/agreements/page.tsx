"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, ArrowRight, FileText } from "lucide-react";

export default function AgreementsListPage() {
  const { userId } = useAuth();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgreements = async () => {
      if (!userId) return;
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const res = await axios.get(`${backendUrl}/api/agreements/user/${userId}`);
        setAgreements(res.data);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchAgreements();
  }, [userId]);

  if (loading) return (
    <div className="flex items-center justify-center p-12 h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--fg)' }}></div>
    </div>
  );

  return (
    <div className="p-8 md:p-12 space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--muted-strong)' }}>Repository</h2>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Agreements</h1>
        </div>
        <Link href="/agreements/create" className="px-6 py-3 font-bold rounded-lg text-sm flex items-center transition-all" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
          <Plus className="h-4 w-4 mr-2" /> New Agreement
        </Link>
      </header>

      {agreements.length === 0 ? (
        <div className="p-20 text-center rounded-lg" style={{ border: '1px dashed var(--border-color)' }}>
          <FileText className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--muted)' }} />
          <p style={{ color: 'var(--muted)' }}>No agreements registered.</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <div className="hidden md:grid grid-cols-5 p-5" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-color)' }}>
            {["Title", "Role", "Amount", "Status", "Action"].map((h, i) => (
              <span key={h} className={`text-xs font-bold uppercase tracking-widest ${i === 4 ? 'text-right' : i > 0 ? 'text-center' : ''}`} style={{ color: 'var(--muted)' }}>{h}</span>
            ))}
          </div>
          {agreements.map((agr) => {
            const isPayer = agr.payerId === userId;
            return (
              <div key={agr.id} className="grid grid-cols-1 md:grid-cols-5 items-center p-5 gap-4 transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-tight" style={{ color: 'var(--fg)' }}>{agr.title}</div>
                  <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{format(new Date(agr.startDate), "MMM dd, yyyy")}</div>
                </div>
                <div className="text-center">
                  <span className="px-3 py-1 text-xs font-bold tracking-wider rounded-md" style={{ background: isPayer ? 'var(--accent)' : 'transparent', color: isPayer ? 'var(--accent-fg)' : 'var(--muted-strong)', border: isPayer ? 'none' : '1px solid var(--border-color)' }}>
                    {isPayer ? "ORIGINATOR" : "BENEFICIARY"}
                  </span>
                </div>
                <div className="text-center font-bold text-lg" style={{ color: 'var(--fg)' }}>
                  ₹{agr.amount} <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>/ {agr.frequency.toLowerCase()}</span>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center justify-center" style={{ color: 'var(--muted-strong)' }}>
                    <span className="h-2 w-2 rounded-full mr-2" style={{ background: agr.status === 'ACTIVE' ? 'var(--accent)' : 'var(--muted)' }}></span>
                    {agr.status}
                  </div>
                </div>
                <div className="text-right">
                  <Link href={`/agreements/${agr.id}`} className="inline-flex items-center text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: 'var(--muted)' }}>
                    Open <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
