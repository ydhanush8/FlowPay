"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { Plus, ArrowRight, CreditCard, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [stats, setStats] = useState({
    activeAgreements: 0,
    pendingPayments: 0,
    totalExpected: 0
  });
  const [recentAgreements, setRecentAgreements] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const agrRes = await axios.get(`${backendUrl}/api/agreements/user/${userId}`);
        const payRes = await axios.get(`${backendUrl}/api/payments/user/${userId}`);
        const agreements = agrRes.data;
        const payments = payRes.data;
        setStats({
          activeAgreements: agreements.filter((a: any) => a.status === 'ACTIVE').length,
          pendingPayments: payments.filter((p: any) => p.status === 'PENDING' || p.status === 'LATE').length,
          totalExpected: payments.filter((p: any) => p.status === 'PENDING' || p.status === 'LATE').reduce((acc: number, curr: any) => acc + curr.amount, 0)
        });
        setRecentAgreements(agreements.slice(0, 5));
        setUpcomingPayments(payments.filter((p: any) => p.status === 'PENDING' || p.status === 'LATE').sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5));
      } catch (error) {
        console.error("Dashboard fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--fg)' }}></div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--muted-strong)' }}>Portfolio Overview</h2>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Welcome, {user?.firstName || 'User'}</h1>
        </div>
        <Link href="/agreements/create" className="px-6 py-3 font-bold rounded-lg text-sm flex items-center transition-all duration-300" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
          <Plus className="h-4 w-4 mr-2" /> New Agreement
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Agreements", val: stats.activeAgreements, icon: FileText },
          { label: "Pending Obligations", val: stats.pendingPayments, icon: Clock },
          { label: "Total Exposure", val: `₹${stats.totalExpected.toLocaleString()}`, icon: CreditCard },
        ].map((s, i) => (
          <div key={i} className="p-8 rounded-lg space-y-4 transition-colors" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-strong)' }}>{s.label}</span>
              <s.icon className="h-4 w-4" style={{ color: 'var(--muted)' }} />
            </div>
            <div className="text-4xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-strong)' }}>Recent Agreements</h3>
            <Link href="/agreements" className="text-xs uppercase font-bold tracking-wider flex items-center transition-colors" style={{ color: 'var(--muted)' }}>
              View All <ArrowRight className="h-3 w-3 ml-2" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentAgreements.length === 0 ? (
              <div className="py-12 text-center rounded-lg text-sm" style={{ border: '1px dashed var(--border-color)', color: 'var(--muted)' }}>No records found.</div>
            ) : (
              recentAgreements.map((agr) => (
                <Link key={agr.id} href={`/agreements/${agr.id}`} className="flex items-center justify-between p-5 rounded-lg transition-all group" style={{ border: '1px solid var(--border-color)', background: 'var(--surface)' }}>
                  <div className="space-y-1">
                    <div className="font-semibold" style={{ color: 'var(--fg)' }}>{agr.title}</div>
                    <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{agr.frequency} • {format(new Date(agr.startDate), "MMM dd, yyyy")}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold" style={{ color: 'var(--fg)' }}>₹{agr.amount}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{agr.status}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-strong)' }}>Upcoming Settlements</h3>
            <Link href="/payments" className="text-xs uppercase font-bold tracking-wider flex items-center transition-colors" style={{ color: 'var(--muted)' }}>
              View History <ArrowRight className="h-3 w-3 ml-2" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingPayments.length === 0 ? (
              <div className="py-12 text-center rounded-lg text-sm" style={{ border: '1px dashed var(--border-color)', color: 'var(--muted)' }}>No upcoming obligations.</div>
            ) : (
              upcomingPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between p-5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--surface)' }}>
                  <div className="space-y-1">
                    <div className="font-semibold" style={{ color: 'var(--fg)' }}>{pay.agreement.title}</div>
                    <div className="text-xs font-medium uppercase tracking-wider flex items-center" style={{ color: 'var(--muted)' }}>
                      <Clock className="h-3 w-3 mr-1.5" /> Due {format(new Date(pay.dueDate), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold" style={{ color: 'var(--fg)' }}>₹{pay.amount}</div>
                      <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{pay.status}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
