import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  PlusCircle,
  FileCheck2,
  ShieldCheck,
  Scale,
  Activity,
  BarChart3,
  ExternalLink,
  Shield,
  ShoppingBag,
  Sparkles,
  Lock,
} from "lucide-react";
import { useWallet, UserRole } from "../context/WalletContext";

interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { networkName, chainId, role, switchRole, configuredAccounts, address } = useWallet();

  // Role-specific navigation items - strictly filtered by active role authorization
  const getNavItemsForRole = (currentRole: UserRole): NavItemConfig[] => {
    switch (currentRole) {
      case "creator":
        return [
          { to: "/dashboard", label: "Creator Studio", icon: LayoutDashboard, badge: "98% Split", badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
          { to: "/register", label: "Register AI Model", icon: PlusCircle, badge: "Anchor", badgeColor: "bg-mp-accent/15 text-mp-accent-light border-mp-accent/30" },
          { to: "/verify", label: "Verify Integrity", icon: ShieldCheck },
          { to: "/compare", label: "Compare Models", icon: Scale },
          { to: "/analytics", label: "Creator Analytics", icon: BarChart3 },
          { to: "/activity", label: "Blockchain Activity", icon: Activity },
        ];
      case "buyer":
        return [
          { to: "/marketplace", label: "Marketplace", icon: Store, badge: "Browse", badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
          { to: "/licenses", label: "My Licenses", icon: FileCheck2, badge: "30-Day", badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
          { to: "/verify", label: "Verify Model Hash", icon: ShieldCheck },
          { to: "/compare", label: "Compare Models", icon: Scale },
          { to: "/activity", label: "Blockchain Activity", icon: Activity },
        ];
      case "admin":
        return [
          { to: "/admin", label: "Admin Console", icon: Shield, badge: "2% Fee", badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
          { to: "/analytics", label: "Platform Analytics", icon: BarChart3 },
          { to: "/marketplace", label: "Marketplace Audit", icon: Store },
          { to: "/verify", label: "Verify Model", icon: ShieldCheck },
          { to: "/activity", label: "Blockchain Activity", icon: Activity },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItemsForRole(role);

  const roleMeta: Record<UserRole, { title: string; subtitle: string; icon: any; color: string; border: string }> = {
    creator: {
      title: "Creator View",
      subtitle: "Model Registry & 98% Royalties",
      icon: Sparkles,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      border: "border-emerald-500/30",
    },
    buyer: {
      title: "Buyer View",
      subtitle: "AI Marketplace & Licensing",
      icon: ShoppingBag,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      border: "border-blue-500/30",
    },
    admin: {
      title: "Admin View",
      subtitle: "2% Protocol Fee & Registry",
      icon: Shield,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      border: "border-purple-500/30",
    },
  };

  const currentMeta = roleMeta[role];
  const CurrentIcon = currentMeta.icon;

  return (
    <aside className="w-64 border-r border-mp-border/60 bg-mp-bg flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-5">
        {/* Active Role Authorization Card */}
        <div className={`rounded-xl border ${currentMeta.border} bg-mp-surface p-3.5 space-y-2.5 transition-all shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mp-text-dim">
              Authorized Scope
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${currentMeta.color}`}>
              <CurrentIcon className="h-3 w-3" />
              <span className="capitalize">{role}</span>
            </span>
          </div>

          <div>
            <div className="text-xs font-bold text-white tracking-tight">{currentMeta.title}</div>
            <p className="text-[11px] text-mp-text-muted mt-0.5 leading-snug">
              {currentMeta.subtitle}
            </p>
          </div>

          {/* Quick role toggle inside sidebar */}
          <div className="pt-2 border-t border-mp-border/50 grid grid-cols-3 gap-1">
            {(["buyer", "creator", "admin"] as const).map((r) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`py-1 text-[10px] font-semibold rounded-lg capitalize transition-all ${
                    active
                      ? "bg-mp-surface-2 text-white border border-mp-border shadow-xs"
                      : "text-mp-text-muted hover:text-white hover:bg-mp-surface-2/40"
                  }`}
                  title={`Switch active view to ${r}`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-mp-text-dim flex items-center justify-between">
            <span>{role.toUpperCase()} NAVIGATION</span>
            <span className="text-[10px] text-mp-accent-light font-mono">{navItems.length} links</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-mp-surface-2 text-white border border-mp-border/80 shadow-sm"
                      : "text-mp-text-muted hover:text-white hover:bg-mp-surface/60"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-mp-accent-light shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${item.badgeColor || "bg-mp-surface text-mp-text-muted border-mp-border"}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Restricted areas indicator */}
        <div className="rounded-xl border border-mp-border/40 bg-mp-surface/30 p-3 text-[11px] text-mp-text-dim space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-mp-text-muted">
            <Lock className="h-3 w-3 text-mp-text-dim" />
            <span>Hidden from {role}:</span>
          </div>
          <div className="text-[10px] text-mp-text-dim">
            {role === "buyer" && "Creator Studio, Model Registration, Admin Console"}
            {role === "creator" && "Buyer License Library, Admin Protocol Console"}
            {role === "admin" && "Model Registration, Personal Licenses"}
          </div>
        </div>
      </div>

      {/* Network & Protocol Status */}
      <div className="border-t border-mp-border/60 pt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-mp-text-muted px-1">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-mp-success" />
            <span>Chain ID</span>
          </span>
          <span className="font-mono text-mp-text">{chainId}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-mp-text-muted px-1">
          <span>Smart Contract</span>
          <a
            href="https://sepolia.etherscan.io"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-mp-accent-light hover:underline font-mono text-[11px]"
          >
            <span>0x5FbD...0aa3</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </aside>
  );
};
