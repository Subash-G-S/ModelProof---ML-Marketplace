import React from "react";
import { Link } from "react-router-dom";
import { useWallet, UserRole } from "../context/WalletContext";
import { ShieldAlert, ArrowRight, UserCheck, Lock } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { role, switchRole } = useWallet();

  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  const primaryAllowed = allowedRoles[0];

  const roleTitles: Record<UserRole, string> = {
    buyer: "Buyer",
    creator: "Model Creator",
    admin: "Admin",
  };

  const roleColorClasses: Record<UserRole, { badge: string; button: string; border: string }> = {
    buyer: {
      badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      button: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20",
      border: "border-blue-500/30",
    },
    creator: {
      badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      button: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20",
      border: "border-emerald-500/30",
    },
    admin: {
      badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      button: "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20",
      border: "border-purple-500/30",
    },
  };

  const myFallbackRoute = role === "creator" ? "/dashboard" : role === "admin" ? "/admin" : "/marketplace";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className={`max-w-lg w-full rounded-2xl border ${roleColorClasses[primaryAllowed]?.border || "border-mp-border"} bg-mp-surface p-8 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-mp-accent/10 rounded-full blur-2xl pointer-events-none" />

        <div className="mx-auto h-16 w-16 rounded-2xl bg-mp-surface-2 border border-mp-border flex items-center justify-center shadow-inner">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Role-Based Access Restricted</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {allowedRoles.map((r) => roleTitles[r]).join(" or ")} UI Only
          </h2>
          <p className="text-xs sm:text-sm text-mp-text-muted leading-relaxed max-w-md mx-auto">
            You are currently browsing with the <strong className="text-white capitalize">{role}</strong> role.
            This section and its actions are strictly authorized for{" "}
            <strong className="text-white capitalize">{allowedRoles.join(" or ")}</strong> accounts.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-mp-bg/80 border border-mp-border/70 text-xs text-left space-y-2">
          <div className="text-[11px] font-semibold text-mp-text-dim uppercase tracking-wider">
            Authorization Matrix
          </div>
          <div className="flex items-center justify-between text-mp-text-muted">
            <span>Your Active Role:</span>
            <span className="font-semibold text-amber-400 capitalize px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {role}
            </span>
          </div>
          <div className="flex items-center justify-between text-mp-text-muted">
            <span>Required Role:</span>
            <span className="font-semibold text-emerald-400 capitalize px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {allowedRoles.join(" / ")}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => switchRole(primaryAllowed)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 ${
              roleColorClasses[primaryAllowed]?.button || "bg-mp-accent hover:bg-mp-accent-light text-white"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Switch Role to {roleTitles[primaryAllowed]}</span>
          </button>

          <Link
            to={myFallbackRoute}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-mp-border hover:bg-mp-surface-2 text-mp-text-muted hover:text-white text-xs font-medium transition-colors"
          >
            <span>Go to My Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
