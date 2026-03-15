"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "@/components/ThemeProvider";
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  History,
  Sun,
  Moon,
  Sparkles,
  Zap
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import axios from "axios";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Create Agreement",
    icon: PlusCircle,
    href: "/agreements/create",
  },
  {
    label: "My Agreements",
    icon: FileText,
    href: "/agreements",
  },
  {
    label: "Payment History",
    icon: History,
    href: "/payments",
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { userId } = useAuth();
  const [plan, setPlan] = useState<string>("FREE");

  useEffect(() => {
    const fetchPlan = async () => {
      if (!userId) return;
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const res = await axios.get(`${backendUrl}/api/payments/user-plan/${userId}`);
        setPlan(res.data?.plan || "FREE");
      } catch (err) {
        console.error("Plan fetch error", err);
      }
    };
    fetchPlan();
  }, [userId]);

  return (
    <div className="space-y-4 py-4 flex flex-col h-full border-r" style={{ background: 'var(--bg)', color: 'var(--fg)', borderColor: 'var(--border-color)' }}>
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold tracking-tight uppercase" style={{ color: 'var(--fg)' }}>FlowPay</h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-lg transition-colors",
                pathname === route.href
                  ? "" 
                  : ""
              )}
              style={{
                background: pathname === route.href ? 'var(--accent)' : 'transparent',
                color: pathname === route.href ? 'var(--accent-fg)' : 'var(--muted-strong)',
              }}
              onMouseEnter={(e) => {
                if (pathname !== route.href) {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== route.href) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>

        {plan === "FREE" && (
          <div className="mt-8 px-4">
            <Link 
              href="/upgrade" 
              className="flex items-center space-x-3 p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-dashed"
              style={{ background: 'var(--surface)', borderColor: 'var(--accent)' }}
            >
              <div className="p-2 rounded-lg" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Limited Plan</p>
                <p className="text-xs font-bold" style={{ color: 'var(--fg)' }}>Upgrade to Pro</p>
              </div>
            </Link>
          </div>
        )}
      </div>
      
      <div className="px-4 py-2">
        <button 
          onClick={toggleTheme}
          className="flex items-center w-full p-3 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          style={{ color: 'var(--muted-strong)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {theme === "dark" ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
         <div className="flex items-center space-x-3">
           <UserButton />
           <div className="flex flex-col">
             <span className="text-xs font-bold uppercase tracking-tight" style={{ color: 'var(--fg)' }}>Account</span>
             <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{plan}</span>
           </div>
         </div>
      </div>
    </div>
  );
};
