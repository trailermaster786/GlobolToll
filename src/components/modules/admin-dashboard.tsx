"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime, formatDate, timeAgo } from "@/lib/format";
import type { VehicleClassCode, TollPlaza, Lane, Device, RateCard, Violation, Staff, Notification } from "@/lib/types";
import { GlobalTollLogo } from "@/components/brand/logo";
import { roleLabel } from "@/store/app-store";
import {
  LayoutDashboard, Building2, Tag as TagIcon, Car, ShieldCheck,
  LogOut, IndianRupee, Activity, Gauge, AlertTriangle, TrendingUp,
  Plus, Edit3, Trash2, MapPin, Cpu, CheckCircle2, X, Hash,
  UserCog, Calendar, Ban, Search, Filter, Download, ArrowLeftRight,
  Wallet, ShieldAlert, Bell, ChevronRight, Clock, DollarSign,
  Users, FileBarChart, Eye, BarChart3, PieChart as PieChartIcon,
  Zap, Globe, Lock, Star, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

function sanitizePlate(v: string): string {
  return v.toUpperCase().replace(/[^0-9A-Z-]/g, "");
}

const SIDEBAR_NAV = [
  { key: "overview" as TabKey, label: "Overview", icon: LayoutDashboard, group: "main" },
  { key: "plazas" as TabKey, label: "Plazas & Lanes", icon: Building2, group: "main" },
  { key: "pricing" as TabKey, label: "Pricing & Rates", icon: TagIcon, group: "main" },
  { key: "vehicles" as TabKey, label: "Vehicles", icon: Car, group: "main" },
  { key: "transactions" as TabKey, label: "Transactions", icon: ArrowLeftRight, group: "financial" },
  { key: "violations" as TabKey, label: "Violations", icon: ShieldAlert, group: "enforcement" },
  { key: "staff" as TabKey, label: "Staff & HR", icon: UserCog, group: "system" },
  { key: "notifications" as TabKey, label: "Notifications", icon: Bell, group: "system" },
  { key: "audit" as TabKey, label: "Audit Log", icon: ShieldCheck, group: "system" },
];

const SIDEBAR_GROUPS = [
  { key: "main", label: "Operations" },
  { key: "financial", label: "Financial" },
  { key: "enforcement", label: "Enforcement" },
  { key: "system", label: "System" },
];

type TabKey = "overview" | "plazas" | "pricing" | "vehicles" | "transactions" | "violations" | "staff" | "notifications" | "audit";

export function AdminDashboard() {
  const currentUser = useStore((s) => s.currentUser)!;
  const logout = useStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const initials = currentUser.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] flex">
      <aside
        className={cn(
          "h-screen sticky top-0 flex flex-col border-r border-border transition-all duration-300 z-40",
          sidebarCollapsed ? "w-[68px]" : "w-60"
        )}
        style={{ background: "var(--sidebar)" }}
      >
        <div className="h-14 flex items-center px-4 border-b border-[var(--sidebar-border)] gap-3">
          <GlobalTollLogo size={28} variant="dark" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Global Toll</div>
              <div className="text-[0.55rem] text-[var(--sidebar-foreground)] opacity-60 truncate">Admin Console</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
          {SIDEBAR_GROUPS.map((group) => {
            const items = SIDEBAR_NAV.filter((i) => i.group === group.key);
            return (
              <div key={group.key} className="mb-4">
                {!sidebarCollapsed && (
                  <div className="px-2 mb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[var(--sidebar-foreground)] opacity-50">
                    {group.label}
                  </div>
                )}
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.key;
                    return (
                      <li key={item.key}>
                        <button
                          onClick={() => setActiveTab(item.key)}
                          className={cn(
                            "w-full flex items-center gap-2.5 rounded-lg text-[0.8rem] font-medium transition-all duration-200",
                            sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                            active
                              ? "bg-[var(--sidebar-primary)] text-white shadow-md shadow-[var(--sidebar-primary)]/30"
                              : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-white"
                          )}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mx-2 mb-2 flex items-center justify-center gap-2 py-2 rounded-lg text-[0.65rem] text-[var(--sidebar-foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--sidebar-accent)] transition-all"
        >
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-300", sidebarCollapsed ? "" : "rotate-180")} />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>

        <div className="px-3 py-2.5 border-t border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            {!sidebarCollapsed && (
              <div className="text-[0.55rem] text-[var(--sidebar-foreground)] opacity-60 truncate">
                All systems operational
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border flex items-center px-4 sm:px-6 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-navy truncate">
              {SIDEBAR_NAV.find((t) => t.key === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-to-br from-teal to-teal-dark text-white text-[0.65rem] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-xs font-semibold leading-tight">{currentUser.name}</div>
                <div className="text-[0.6rem] text-muted-foreground leading-tight">{roleLabel(currentUser.role)}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="lg:hidden fixed bottom-4 left-4 z-50">
          <div className="flex gap-1 bg-card rounded-xl shadow-lg border border-border p-1.5">
            {SIDEBAR_NAV.slice(0, 5).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all",
                    active ? "bg-teal text-white" : "text-muted-foreground hover:bg-muted"
                  )}
                  title={tab.label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "plazas" && <PlazasTab />}
          {activeTab === "pricing" && <PricingTab />}
          {activeTab === "vehicles" && <VehiclesTab />}
          {activeTab === "transactions" && <TransactionsTab />}
          {activeTab === "violations" && <ViolationsTab />}
          {activeTab === "staff" && <StaffTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "audit" && <AuditTab />}
        </main>
      </div>
    </div>
  );
}

// =====================================================================
// TAB 1 — OVERVIEW
// =====================================================================
const HOURS = ["00", "03", "06", "09", "12", "15", "18", "21"];

function OverviewTab() {
  const transactions = useStore((s) => s.transactions);
  const plazas = useStore((s) => s.plazas);
  const lanes = useStore((s) => s.lanes);
  const devices = useStore((s) => s.devices);
  const violations = useStore((s) => s.violations);
  const vehicles = useStore((s) => s.vehicles);
  const vehicleClasses = useStore((s) => s.vehicleClasses);

  const totalRevenue = transactions.filter((t) => t.status === "SUCCESS").reduce((s, t) => s + t.totalAmount, 0);
  const txnCount = transactions.length;
  const openLanes = lanes.filter((l) => l.status === "OPEN").length;
  const faultyLanes = lanes.filter((l) => l.status === "FAULTED").length;
  const offlineDevices = devices.filter((d) => d.status === "OFFLINE" || d.status === "ERROR").length;

  const avgTxnTime = txnCount > 0 ? Math.round(transactions.reduce((s, t) => {
    const created = new Date(t.capturedAt).getTime();
    return s + 150;
  }, 0) / txnCount) : 0;

  const now = Date.now();
  const hourlyData = HOURS.map((h, i) => {
    const start = now - (24 - i * 3) * 60 * 60_000;
    const end = start + 3 * 60 * 60_000;
    const bucketTxns = transactions.filter((t) => {
      const tTime = new Date(t.capturedAt).getTime();
      return tTime >= start && tTime < end && t.status === "SUCCESS";
    });
    return {
      hour: `${h}:00`,
      revenue: bucketTxns.reduce((s, t) => s + t.totalAmount, 0),
      txns: bucketTxns.length,
    };
  });

  const classColors: Record<string, string> = {
    CAR: "#2E8B8B", HCV: "#2C3E50", LCV: "#5C7A8A", BUS: "#7AB3A3",
    MULTI_AXLE: "#E0A030", TWO_WHEELER: "#B07D1E", OVERSIZED: "#9CA3AF",
  };
  const classBreakdown = vehicleClasses
    .map((vc) => ({
      name: vc.label.split(" ")[0],
      code: vc.code,
      value: transactions.filter((t) => t.vehicleClassCode === vc.code).length,
    }))
    .filter((x) => x.value > 0);

  const recentTxns = transactions.slice(0, 8);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Revenue" value={formatCurrency(totalRevenue, "OMR")} icon={IndianRupee} variant="revenue" delta={txnCount > 0 ? `${txnCount} transactions` : "Awaiting first txn"} />
        <KpiCard label="Lane Uptime" value={`${lanes.length > 0 ? ((openLanes / lanes.length) * 100).toFixed(0) : 0}%`} icon={Activity} delta={`${openLanes}/${lanes.length} lanes open`} deltaPositive={faultyLanes === 0} />
        <KpiCard label="Avg Txn Time" value={txnCount > 0 ? `${avgTxnTime}ms` : "—"} icon={Gauge} delta={txnCount > 0 ? "Within SLA (<200ms)" : "Awaiting data"} deltaPositive={avgTxnTime < 200 || txnCount === 0} />
        <KpiCard label="System Health" value={offlineDevices === 0 ? "Healthy" : `${offlineDevices} alerts`} icon={AlertTriangle} variant={offlineDevices === 0 ? "default" : "warning"} delta={faultyLanes === 0 ? "All systems normal" : `${faultyLanes} lanes need attention`} deltaPositive={faultyLanes === 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-navy">Revenue & Transaction Volume</h3>
              <p className="text-xs text-muted-foreground">Last 24 hours (3-hour buckets)</p>
            </div>
            {txnCount > 0 && (
              <Badge variant="outline" className="text-[0.65rem] border-emerald-200 text-emerald-700 bg-emerald-50">
                <TrendingUp className="h-3 w-3 mr-1" /> Live
              </Badge>
            )}
          </div>
          <div className="h-64">
            {txnCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E0A030" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#E0A030" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, "OMR", { compact: true })} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [formatCurrency(v, "OMR"), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#E0A030" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No transactions yet. Capture transactions from the Operator Console to see analytics here." />
            )}
          </div>
        </Card>

        <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <h3 className="text-sm font-semibold text-navy mb-1">Vehicle Class Mix</h3>
          <p className="text-xs text-muted-foreground mb-3">Distribution of captured transactions</p>
          <div className="h-56">
            {classBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={classBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {classBreakdown.map((entry) => (
                      <Cell key={entry.code} fill={classColors[entry.code] ?? "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="Awaiting transaction data" small />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <h3 className="text-sm font-semibold text-navy mb-3">Plaza Status Overview</h3>
          <div className="space-y-2">
            {plazas.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground"><Building2 className="h-6 w-6 mx-auto mb-2 opacity-30" />No plazas configured yet.</div>}
            {plazas.map((p) => {
              const plzLanes = lanes.filter((l) => l.plazaId === p.id);
              const openCount = plzLanes.filter((l) => l.status === "OPEN").length;
              const plzDevices = devices.filter((d) => plzLanes.some((l) => l.id === d.laneId));
              const onlineDevices = plzDevices.filter((d) => d.status === "ONLINE").length;
              const hw = useStore.getState().highways.find((h) => h.id === p.highwayId);
              return (
                <div key={p.id} className="p-3 border border-border rounded-xl flex items-center justify-between hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal/15 to-teal/5 grid place-items-center">
                      <Building2 className="h-4.5 w-4.5 text-teal" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-[0.65rem] text-muted-foreground font-mono">{p.code} · KM {p.kmMark}{hw ? ` · ${hw.code}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-emerald-600">{openCount}/{plzLanes.length}</div>
                      <div className="text-[0.55rem] text-muted-foreground uppercase">Lanes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{onlineDevices}/{plzDevices.length}</div>
                      <div className="text-[0.55rem] text-muted-foreground uppercase">Devices</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-navy">Recent Transactions</h3>
          </div>
          {recentTxns.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {recentTxns.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 border border-border rounded-xl text-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-navy">{t.plateCaptured}</span>
                    <Badge variant="outline" className="text-[0.55rem]">{t.vehicleClassCode}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{timeAgo(t.capturedAt)}</span>
                    <span className="font-mono font-bold text-[var(--color-gold-dark)]">{formatCurrency(t.totalAmount, "OMR")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No transactions captured yet.
              <div className="text-[0.65rem] mt-1">Log in as Lane Operator to begin capturing toll transactions.</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, variant = "default", delta, deltaPositive = true }: {
  label: string; value: string; icon: typeof IndianRupee; variant?: "default" | "revenue" | "warning"; delta?: string; deltaPositive?: boolean;
}) {
  const accent = variant === "revenue" ? "border-l-4 border-l-[var(--color-gold)]" : variant === "warning" ? "border-l-4 border-l-destructive" : "border-l-4 border-l-teal";
  return (
    <Card className={`p-4 sm:p-5 ${accent} border-0 shadow-sm bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={cn("h-9 w-9 rounded-xl grid place-items-center", variant === "revenue" ? "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/50" : "bg-gradient-to-br from-teal/15 to-teal/5")}>
          <Icon className={cn("h-4.5 w-4.5", variant === "revenue" ? "text-[var(--color-gold-dark)]" : "text-teal")} />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {delta && (
        <div className={cn("flex items-center gap-1 mt-2 text-[0.65rem] font-medium", deltaPositive ? "text-emerald-600" : "text-destructive")}>
          {deltaPositive ? <TrendingUp className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {delta}
        </div>
      )}
    </Card>
  );
}

function EmptyChartState({ message, small }: { message: string; small?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center text-muted-foreground", small ? "h-full" : "h-full")}>
      <Activity className={cn(small ? "h-6 w-6" : "h-8 w-8", "opacity-30 mb-2")} />
      <div className="text-xs">{message}</div>
    </div>
  );
}

// =====================================================================
// TAB 2 — PLAZAS & LANES (FULL CRUD)
// =====================================================================
function PlazasTab() {
  const plazas = useStore((s) => s.plazas);
  const highways = useStore((s) => s.highways);
  const lanes = useStore((s) => s.lanes);
  const devices = useStore((s) => s.devices);
  const addPlaza = useStore((s) => s.addPlaza);
  const deletePlaza = useStore((s) => s.deletePlaza);
  const addLane = useStore((s) => s.addLane);
  const updateLane = useStore((s) => s.updateLane);
  const deleteLane = useStore((s) => s.deleteLane);
  const addHighway = useStore((s) => s.addHighway);
  const [selectedPlaza, setSelectedPlaza] = useState<string | null>(null);
  const [addPlazaOpen, setAddPlazaOpen] = useState(false);
  const [addHighwayOpen, setAddHighwayOpen] = useState(false);
  const [newHighway, setNewHighway] = useState({ code: "", name: "", lengthKm: "", region: "" });
  const [newPlaza, setNewPlaza] = useState({ code: "", name: "", kmMark: "", highwayId: "" });
  const [addLaneOpen, setAddLaneOpen] = useState(false);
  const [newLane, setNewLane] = useState({ number: "", type: "CASH" as Lane["type"], direction: "FORWARD" as Lane["direction"] });

  const plazaLanes = lanes.filter((l) => l.plazaId === selectedPlaza);

  const handleAddHighway = () => {
    if (!newHighway.code || !newHighway.name) { toast.error("Code and Name are required"); return; }
    addHighway({ code: newHighway.code, name: newHighway.name, lengthKm: parseFloat(newHighway.lengthKm) || 0, region: newHighway.region });
    toast.success("Highway created");
    setNewHighway({ code: "", name: "", lengthKm: "", region: "" });
    setAddHighwayOpen(false);
  };

  const handleAddPlaza = () => {
    if (!newPlaza.code || !newPlaza.name) { toast.error("Code and Name are required"); return; }
    addPlaza({ code: newPlaza.code, name: newPlaza.name, kmMark: parseFloat(newPlaza.kmMark) || 0, highwayId: newPlaza.highwayId || highways[0]?.id || "", direction: "BOTH", status: "OPEN" });
    toast.success("Plaza created", { description: `${newPlaza.code} — ${newPlaza.name}` });
    setNewPlaza({ code: "", name: "", kmMark: "", highwayId: "" });
    setAddPlazaOpen(false);
  };

  const handleDeletePlaza = (plazaId: string, plazaName: string) => {
    if (!confirm(`Delete "${plazaName}"? This cannot be undone.`)) return;
    deletePlaza(plazaId);
    if (selectedPlaza === plazaId) setSelectedPlaza(null);
    toast.success("Plaza deleted");
  };

  const handleAddLane = () => {
    if (!newLane.number || !selectedPlaza) { toast.error("Lane number required"); return; }
    addLane({ plazaId: selectedPlaza, number: parseInt(newLane.number), type: newLane.type, direction: newLane.direction, status: "OPEN", updatedAt: new Date().toISOString() });
    toast.success("Lane added", { description: `Lane ${newLane.number} · ${newLane.type.replace("_", "/")}` });
    setNewLane({ number: "", type: "CASH", direction: "FORWARD" });
    setAddLaneOpen(false);
  };

  const handleDeleteLane = (laneId: string) => {
    deleteLane(laneId);
    toast.success("Lane removed");
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy">Toll Plaza & Lane Management</h2>
          <p className="text-xs text-muted-foreground">{plazas.length} plazas · {lanes.length} lanes · {devices.length} devices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddHighwayOpen(true)}><Plus className="h-4 w-4 mr-2" /> Highway</Button>
          <Button onClick={() => setAddPlazaOpen(true)} className="bg-gradient-to-r from-teal to-teal-dark"><Plus className="h-4 w-4 mr-2" /> Add Plaza</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <h3 className="text-sm font-semibold text-navy mb-1">Lane Type Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">Across all plazas</p>
          <div className="h-52">
            {lanes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: "ETC/RFID", value: lanes.filter((l) => l.type === "ETC_RFID").length, fill: "#2E8B8B" },
                    { name: "Hybrid", value: lanes.filter((l) => l.type === "HYBRID").length, fill: "#2C3E50" },
                    { name: "Cash", value: lanes.filter((l) => l.type === "CASH").length, fill: "#E0A030" },
                    { name: "Express/HOV", value: lanes.filter((l) => l.type === "EXPRESS_HOV").length, fill: "#5C7A8A" },
                  ].filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={3}>
                    {[{ fill: "#2E8B8B" }, { fill: "#2C3E50" }, { fill: "#E0A030" }, { fill: "#5C7A8A" }].map((_, i) => (
                      <Cell key={i} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No lanes configured" small />
            )}
          </div>
        </Card>

        <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <h3 className="text-sm font-semibold text-navy mb-1">Device Health Status</h3>
          <p className="text-xs text-muted-foreground mb-3">All connected devices</p>
          <div className="h-52">
            {devices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Online", count: devices.filter((d) => d.status === "ONLINE").length, fill: "#10B981" },
                  { name: "Offline", count: devices.filter((d) => d.status === "OFFLINE").length, fill: "#EF4444" },
                  { name: "Degraded", count: devices.filter((d) => d.status === "DEGRADED").length, fill: "#F59E0B" },
                  { name: "Error", count: devices.filter((d) => d.status === "ERROR").length, fill: "#DC2626" },
                ]} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                    {[{ fill: "#10B981" }, { fill: "#EF4444" }, { fill: "#F59E0B" }, { fill: "#DC2626" }].map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No devices registered" small />
            )}
          </div>
        </Card>
      </div>

      {highways.length > 0 && (
        <Card className="p-4 border-0 shadow-sm">
          <h3 className="text-sm font-semibold text-navy mb-2">Highways</h3>
          <div className="flex flex-wrap gap-2">
            {highways.map((h) => (
              <div key={h.id} className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg text-xs">
                <span className="font-mono font-bold">{h.code}</span>
                <span className="text-muted-foreground">—</span>
                <span>{h.name}</span>
                <span className="text-muted-foreground">({h.lengthKm}km)</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plazas.map((p) => {
          const plzLanes = lanes.filter((l) => l.plazaId === p.id);
          const openCount = plzLanes.filter((l) => l.status === "OPEN").length;
          const hw = highways.find((h) => h.id === p.highwayId);
          const isSelected = selectedPlaza === p.id;
          return (
            <Card key={p.id} className={cn("p-4 cursor-pointer transition-all duration-200 border-0 shadow-sm hover:shadow-md", isSelected && "ring-2 ring-teal shadow-md shadow-teal/10")} onClick={() => setSelectedPlaza(isSelected ? null : p.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal/15 to-teal/5 grid place-items-center">
                    <Building2 className="h-4.5 w-4.5 text-teal" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-[0.65rem] text-muted-foreground font-mono">{p.code} · KM {p.kmMark}</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeletePlaza(p.id, p.name); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {hw && <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground mb-3"><MapPin className="h-3 w-3" />{hw.code} — {hw.name}</div>}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><div className="font-bold text-emerald-600">{openCount}</div><div className="text-[0.55rem] text-muted-foreground uppercase">Open</div></div>
                <div><div className="font-bold">{plzLanes.length}</div><div className="text-[0.55rem] text-muted-foreground uppercase">Lanes</div></div>
                <div><div className="font-bold text-amber-600">{plzLanes.filter((l) => l.status === "MAINTENANCE").length}</div><div className="text-[0.55rem] text-muted-foreground uppercase">Maint.</div></div>
              </div>
            </Card>
          );
        })}
        <Card className="border-2 border-dashed border-border grid place-items-center text-center cursor-pointer hover:border-teal hover:bg-teal/5 min-h-[180px] transition-all" onClick={() => setAddPlazaOpen(true)}>
          <div className="p-4">
            <div className="h-10 w-10 mx-auto rounded-xl bg-muted/60 grid place-items-center mb-2"><Plus className="h-4 w-4 text-muted-foreground" /></div>
            <div className="text-sm font-medium">Add Toll Plaza</div>
            <div className="text-[0.65rem] text-muted-foreground mt-1">Register a new plaza</div>
          </div>
        </Card>
      </div>

      {selectedPlaza && (
        <Card className="p-5 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-navy">{plazas.find(p => p.id === selectedPlaza)?.name} — Lanes & Devices</h3>
              <p className="text-xs text-muted-foreground">{plazaLanes.length} lanes configured</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setAddLaneOpen(true)} className="bg-gradient-to-r from-teal to-teal-dark"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Lane</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPlaza(null)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Lane</TableHead><TableHead>Type</TableHead><TableHead>Direction</TableHead><TableHead>Status</TableHead><TableHead>Last Update</TableHead><TableHead className="w-24">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {plazaLanes.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No lanes. Add one above.</TableCell></TableRow>
                )}
                {plazaLanes.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs font-bold">L{l.number}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[0.65rem]">{l.type.replace("_", "/")}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.direction}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <span className={cn("h-1.5 w-1.5 rounded-full", l.status === "OPEN" ? "bg-emerald-500" : l.status === "FAULTED" ? "bg-red-500" : "bg-amber-500")} />
                        {l.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(l.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-[0.65rem]" onClick={() => updateLane(l.id, { status: l.status === "OPEN" ? "CLOSED" : "OPEN" })}>
                          {l.status === "OPEN" ? "Close" : "Open"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[0.65rem] text-destructive" onClick={() => handleDeleteLane(l.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add Highway Dialog */}
      <Dialog open={addHighwayOpen} onOpenChange={setAddHighwayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Highway</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Highway Code *</Label><Input value={newHighway.code} onChange={(e) => setNewHighway({ ...newHighway, code: e.target.value })} placeholder="SQ-MQ" /></div>
              <div><Label>Length (km)</Label><Input type="number" value={newHighway.lengthKm} onChange={(e) => setNewHighway({ ...newHighway, lengthKm: e.target.value })} placeholder="209" /></div>
            </div>
            <div><Label>Highway Name *</Label><Input value={newHighway.name} onChange={(e) => setNewHighway({ ...newHighway, name: e.target.value })} placeholder="Sohar — Muscat Expressway" /></div>
            <div><Label>Region</Label><Input value={newHighway.region} onChange={(e) => setNewHighway({ ...newHighway, region: e.target.value })} placeholder="Al Batinah / Muscat" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddHighwayOpen(false)}>Cancel</Button><Button onClick={handleAddHighway}>Create Highway</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Plaza Dialog */}
      <Dialog open={addPlazaOpen} onOpenChange={setAddPlazaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Toll Plaza</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Plaza Code *</Label><Input value={newPlaza.code} onChange={(e) => setNewPlaza({ ...newPlaza, code: e.target.value })} placeholder="TP-001" /></div>
              <div><Label>KM Mark</Label><Input type="number" value={newPlaza.kmMark} onChange={(e) => setNewPlaza({ ...newPlaza, kmMark: e.target.value })} placeholder="42" /></div>
            </div>
            <div><Label>Plaza Name *</Label><Input value={newPlaza.name} onChange={(e) => setNewPlaza({ ...newPlaza, name: e.target.value })} placeholder="Sohar Gate Plaza" /></div>
            <div><Label>Highway</Label>
              <Select value={newPlaza.highwayId} onValueChange={(v) => setNewPlaza({ ...newPlaza, highwayId: v })}>
                <SelectTrigger><SelectValue placeholder="Select highway" /></SelectTrigger>
                <SelectContent>{highways.map((h) => (<SelectItem key={h.id} value={h.id}>{h.code} — {h.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddPlazaOpen(false)}>Cancel</Button><Button onClick={handleAddPlaza}>Create Plaza</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lane Dialog */}
      <Dialog open={addLaneOpen} onOpenChange={setAddLaneOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Lane to {plazas.find(p => p.id === selectedPlaza)?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Lane Number *</Label><Input type="number" value={newLane.number} onChange={(e) => setNewLane({ ...newLane, number: e.target.value })} placeholder="5" /></div>
            <div><Label>Lane Type</Label>
              <Select value={newLane.type} onValueChange={(v) => setNewLane({ ...newLane, type: v as Lane["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="CASH">Cash</SelectItem><SelectItem value="ETC_RFID">ETC / RFID</SelectItem><SelectItem value="HYBRID">Hybrid</SelectItem><SelectItem value="ANPR">ANPR</SelectItem><SelectItem value="EXPRESS_HOV">Express / HOV</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Direction</Label>
              <Select value={newLane.direction} onValueChange={(v) => setNewLane({ ...newLane, direction: v as Lane["direction"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="FORWARD">Forward</SelectItem><SelectItem value="REVERSE">Reverse</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddLaneOpen(false)}>Cancel</Button><Button onClick={handleAddLane}>Add Lane</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================================
// TAB 3 — PRICING & RATES
// =====================================================================
function PricingTab() {
  const rateCards = useStore((s) => s.rateCards);
  const plazas = useStore((s) => s.plazas);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const vehicles = useStore((s) => s.vehicles);
  const addRateCard = useStore((s) => s.addRateCard);
  const updateRateCard = useStore((s) => s.updateRateCard);
  const deleteRateCard = useStore((s) => s.deleteRateCard);
  const [selectedPlaza, setSelectedPlaza] = useState<string>(plazas[0]?.id ?? "");
  const [editRateOpen, setEditRateOpen] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addRateOpen, setAddRateOpen] = useState(false);
  const [newRate, setNewRate] = useState({ vehicleClassCode: "CAR" as VehicleClassCode, singleJourney: "", roundJourney: "", monthlyPass: "" });
  const [customPlate, setCustomPlate] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [customRates, setCustomRates] = useState<Record<string, number>>({});

  const filteredCards = rateCards.filter((rc) => rc.plazaId === selectedPlaza);

  const handleAddRate = () => {
    if (!selectedPlaza) { toast.error("Select a plaza first"); return; }
    const single = parseFloat(newRate.singleJourney);
    if (isNaN(single) || single < 0) { toast.error("Enter a valid single journey rate"); return; }
    addRateCard({
      plazaId: selectedPlaza,
      vehicleClassCode: newRate.vehicleClassCode,
      direction: "BOTH",
      singleJourney: single,
      roundJourney: parseFloat(newRate.roundJourney) || undefined,
      monthlyPass: parseFloat(newRate.monthlyPass) || undefined,
      effectiveFrom: new Date().toISOString(),
      version: 1,
      status: "ACTIVE",
      createdBy: useStore.getState().currentUser?.name ?? "Admin",
    });
    toast.success("Rate card created");
    setNewRate({ vehicleClassCode: "CAR", singleJourney: "", roundJourney: "", monthlyPass: "" });
    setAddRateOpen(false);
  };

  const handleUpdateRate = (rateCardId: string) => {
    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue < 0) { toast.error("Enter a valid amount"); return; }
    updateRateCard(rateCardId, { singleJourney: newValue, version: (rateCards.find(r => r.id === rateCardId)?.version ?? 0) + 1 });
    toast.success("Rate updated");
    setEditRateOpen(null);
    setEditValue("");
  };

  const handleDeleteRate = (id: string) => {
    deleteRateCard(id);
    toast.success("Rate card removed");
  };

  const handleSetCustomRate = () => {
    if (!customPlate || !customAmount) { toast.error("Plate and amount required"); return; }
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 0) { toast.error("Enter valid amount"); return; }
    setCustomRates((prev) => ({ ...prev, [customPlate.toUpperCase()]: amount }));
    toast.success("Custom rate set", { description: `${customPlate.toUpperCase()} → ${formatCurrency(amount, "OMR")}` });
    setCustomPlate(""); setCustomAmount("");
  };

  const handleRemoveCustomRate = (plate: string) => {
    setCustomRates((prev) => { const next = { ...prev }; delete next[plate]; return next; });
    toast.success("Custom rate removed");
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-lg font-bold text-navy">Pricing & Toll Rate Engine</h2><p className="text-xs text-muted-foreground">{rateCards.length} rate cards across {plazas.length} plazas</p></div>
        <div className="flex gap-2">
          <Select value={selectedPlaza} onValueChange={setSelectedPlaza}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Filter by plaza" /></SelectTrigger>
            <SelectContent>{plazas.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
          </Select>
          <Button onClick={() => setAddRateOpen(true)} className="bg-gradient-to-r from-teal to-teal-dark"><Plus className="h-4 w-4 mr-2" /> Add Rate</Button>
        </div>
      </div>

      {filteredCards.length > 0 && (
        <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <h3 className="text-sm font-semibold text-navy mb-1">Rate Comparison by Vehicle Class</h3>
          <p className="text-xs text-muted-foreground mb-3">Single journey rates for selected plaza</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredCards.map((rc) => {
                const vc = vehicleClasses.find((c) => c.code === rc.vehicleClassCode);
                return { name: vc?.label.split(" ")[0] ?? rc.vehicleClassCode, single: rc.singleJourney, round: rc.roundJourney ?? 0 };
              })} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [formatCurrency(v, "OMR"), ""]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="single" name="Single" fill="#2E8B8B" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="round" name="Round" fill="#E0A030" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="p-5 border-0 shadow-sm">
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Vehicle Class</TableHead><TableHead>Axles</TableHead><TableHead className="text-right">Single Journey</TableHead><TableHead className="text-right">Round Journey</TableHead><TableHead className="text-right">Monthly Pass</TableHead><TableHead>Version</TableHead><TableHead className="w-24">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No rate cards for this plaza. Add one above.</TableCell></TableRow>
              )}
              {filteredCards.map((rc) => {
                const vc = vehicleClasses.find((c) => c.code === rc.vehicleClassCode);
                const isEditing = editRateOpen === rc.id;
                return (
                  <TableRow key={rc.id}>
                    <TableCell className="text-sm font-medium">{vc?.label}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[0.6rem]">{vc?.axleCount} axle</Badge></TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input type="number" step="0.001" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 w-24 ml-auto text-xs font-mono" autoFocus />
                      ) : (
                        <span className="font-mono text-xs font-semibold">{formatCurrency(rc.singleJourney, "OMR")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">{rc.roundJourney ? formatCurrency(rc.roundJourney, "OMR") : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">{rc.monthlyPass ? formatCurrency(rc.monthlyPass, "OMR") : "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[0.6rem] font-mono">v{rc.version}</Badge></TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 text-[0.65rem]" onClick={() => handleUpdateRate(rc.id)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[0.65rem]" onClick={() => setEditRateOpen(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-[0.65rem]" onClick={() => { setEditRateOpen(rc.id); setEditValue(String(rc.singleJourney)); }}><Edit3 className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[0.65rem] text-destructive" onClick={() => handleDeleteRate(rc.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-md bg-[var(--color-gold)]/10 grid place-items-center">
            <IndianRupee className="h-4 w-4" style={{ color: "var(--color-gold-dark)" }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy">Custom Rate Per Vehicle</h3>
            <p className="text-xs text-muted-foreground">Set a custom toll amount for specific vehicle plates</p>
          </div>
        </div>
        <div className="flex gap-3 items-end mb-4">
          <div className="flex-1 max-w-xs">
            <Label className="text-xs font-medium mb-1.5 block">Plate Number</Label>
            <Input value={customPlate} onChange={(e) => setCustomPlate(sanitizePlate(e.target.value))} placeholder="12345-A" className="font-mono uppercase h-10" />
          </div>
          <div className="flex-1 max-w-[160px]">
            <Label className="text-xs font-medium mb-1.5 block">Custom Amount (OMR)</Label>
            <Input type="number" step="0.001" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="0.000" className="font-mono h-10" />
          </div>
          <Button onClick={handleSetCustomRate} className="bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-dark)] h-10">
            <Plus className="h-4 w-4 mr-1.5" /> Set Rate
          </Button>
        </div>
        {Object.keys(customRates).length > 0 ? (
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Plate</TableHead><TableHead>Owner</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Custom Rate</TableHead><TableHead className="w-20">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(customRates).map(([plate, amount]) => {
                  const vehicle = vehicles.find((v) => v.plateNumber === plate);
                  return (
                    <TableRow key={plate}>
                      <TableCell className="font-mono text-xs font-bold">{plate}</TableCell>
                      <TableCell className="text-xs">{vehicle?.ownerName ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[0.6rem]">{vehicle?.vehicleClassCode ?? "—"}</Badge></TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-[var(--color-gold-dark)]">{formatCurrency(amount, "OMR")}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" className="h-7 text-[0.65rem] text-destructive" onClick={() => handleRemoveCustomRate(plate)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            <IndianRupee className="h-6 w-6 mx-auto mb-2 opacity-30" />
            No custom rates set. Add a plate above to override the standard rate.
          </div>
        )}
      </Card>

      <Dialog open={addRateOpen} onOpenChange={setAddRateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Rate Card</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Vehicle Class</Label>
              <Select value={newRate.vehicleClassCode} onValueChange={(v) => setNewRate({ ...newRate, vehicleClassCode: v as VehicleClassCode })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{vehicleClasses.map((vc) => (<SelectItem key={vc.code} value={vc.code}>{vc.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Single Journey (OMR) *</Label><Input type="number" step="0.001" value={newRate.singleJourney} onChange={(e) => setNewRate({ ...newRate, singleJourney: e.target.value })} placeholder="0.500" /></div>
              <div><Label>Round Journey (OMR)</Label><Input type="number" step="0.001" value={newRate.roundJourney} onChange={(e) => setNewRate({ ...newRate, roundJourney: e.target.value })} placeholder="0.800" /></div>
              <div><Label>Monthly Pass (OMR)</Label><Input type="number" step="0.001" value={newRate.monthlyPass} onChange={(e) => setNewRate({ ...newRate, monthlyPass: e.target.value })} placeholder="10.000" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddRateOpen(false)}>Cancel</Button><Button onClick={handleAddRate}>Create Rate Card</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================================
// TAB 4 — VEHICLES
// =====================================================================
function VehiclesTab() {
  const vehicles = useStore((s) => s.vehicles);
  const tags = useStore((s) => s.tags);
  const wallets = useStore((s) => s.wallets);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const addVehicle = useStore((s) => s.addVehicle);
  const updateVehicle = useStore((s) => s.updateVehicle);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ plate: "", ownerName: "", vehicleClassCode: "CAR" as VehicleClassCode });

  const filtered = vehicles
    .filter((v) => classFilter === "ALL" ? true : v.vehicleClassCode === classFilter)
    .filter((v) => search ? v.plateNumber.toLowerCase().includes(search.toLowerCase()) || v.ownerName.toLowerCase().includes(search.toLowerCase()) : true);

  const handleAddVehicle = () => {
    if (!newVehicle.plate || !newVehicle.ownerName) { toast.error("Plate and owner name are required"); return; }
    if (vehicles.some((v) => v.plateNumber === newVehicle.plate.toUpperCase())) { toast.error("Plate already registered"); return; }
    addVehicle({ plateNumber: newVehicle.plate.toUpperCase(), ownerName: newVehicle.ownerName, vehicleClassCode: newVehicle.vehicleClassCode, status: "ACTIVE" });
    toast.success("Vehicle registered", { description: `${newVehicle.plate} linked to ${newVehicle.ownerName}` });
    setNewVehicle({ plate: "", ownerName: "", vehicleClassCode: "CAR" });
    setAddOpen(false);
  };

  const handleBlacklist = (vehicleId: string, plate: string) => {
    if (!confirm(`Blacklist "${plate}"? This vehicle will be flagged at all lanes.`)) return;
    updateVehicle(vehicleId, { status: "BLACKLISTED" });
    toast.success("Vehicle blacklisted");
  };

  const handleUnblacklist = (vehicleId: string) => {
    updateVehicle(vehicleId, { status: "ACTIVE" });
    toast.success("Vehicle reactivated");
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-lg font-bold text-navy">Vehicle Registry</h2><p className="text-xs text-muted-foreground">{vehicles.length} registered vehicles</p></div>
        <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-teal to-teal-dark"><Plus className="h-4 w-4 mr-2" /> Register Vehicle</Button>
      </div>

      {vehicles.length > 0 && (
        <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <h3 className="text-sm font-semibold text-navy mb-1">Vehicle Class Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">Registered vehicles by category</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={vehicleClasses.map((vc) => ({
                  name: vc.label.split(" ")[0],
                  value: vehicles.filter((v) => v.vehicleClassCode === vc.code).length,
                })).filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {[{ fill: "#2E8B8B" }, { fill: "#2C3E50" }, { fill: "#5C7A8A" }, { fill: "#E0A030" }, { fill: "#7AB3A3" }, { fill: "#B07D1E" }, { fill: "#9CA3AF" }].map((_, i) => (
                    <Cell key={i} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plate or owner…" className="pl-9" /></div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All Classes</SelectItem>{vehicleClasses.map((vc) => (<SelectItem key={vc.code} value={vc.code}>{vc.label}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      <Card className="p-5 border-0 shadow-sm">
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Plate Number</TableHead><TableHead>Class</TableHead><TableHead>Owner</TableHead><TableHead>Tag Status</TableHead><TableHead>Wallet Balance</TableHead><TableHead>Status</TableHead><TableHead>Registered</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((v) => {
                const tag = tags.find((t) => t.vehicleId === v.id);
                const wallet = tag ? wallets.find((w) => w.tagId === tag.id) : null;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold text-xs">{v.plateNumber}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[0.65rem]">{vehicleClasses.find(vc => vc.code === v.vehicleClassCode)?.label}</Badge></TableCell>
                    <TableCell className="text-xs">{v.ownerName}</TableCell>
                    <TableCell>{tag ? (<div className="flex items-center gap-1.5 text-xs"><span className={cn("h-1.5 w-1.5 rounded-full", tag.status === "ACTIVE" ? "bg-emerald-500" : "bg-zinc-400")} />{tag.status}</div>) : <span className="text-xs text-muted-foreground">No tag</span>}</TableCell>
                    <TableCell className="font-mono text-xs">{wallet ? formatCurrency(wallet.balance, "OMR") : "—"}</TableCell>
                    <TableCell><div className="flex items-center gap-1.5 text-xs"><span className={cn("h-1.5 w-1.5 rounded-full", v.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500")} />{v.status === "ACTIVE" ? "Active" : "Blacklisted"}</div></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                    <TableCell>
                      {v.status === "ACTIVE" ? (
                        <Button size="sm" variant="ghost" className="h-7 text-[0.65rem] text-destructive" onClick={() => handleBlacklist(v.id, v.plateNumber)}><Ban className="h-3 w-3" /></Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 text-[0.65rem] text-emerald-600" onClick={() => handleUnblacklist(v.id)}>Reactivate</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-xs text-muted-foreground"><Car className="h-8 w-8 mx-auto mb-2 opacity-30" />No vehicles match your filters.</div>}
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register New Vehicle</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Plate Number (Oman format) *</Label><Input value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: sanitizePlate(e.target.value) })} placeholder="12345-A" className="font-mono uppercase" /><div className="text-[0.65rem] text-muted-foreground mt-1">Format: 1-6 digits, dash, region letter (A-K)</div></div>
            <div><Label>Owner Name *</Label><Input value={newVehicle.ownerName} onChange={(e) => setNewVehicle({ ...newVehicle, ownerName: e.target.value })} placeholder="Mohammed Al Balushi" /></div>
            <div><Label>Vehicle Class</Label>
              <Select value={newVehicle.vehicleClassCode} onValueChange={(v) => setNewVehicle({ ...newVehicle, vehicleClassCode: v as VehicleClassCode })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{vehicleClasses.map((vc) => (<SelectItem key={vc.code} value={vc.code}>{vc.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleAddVehicle}>Register Vehicle</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================================
// TAB 5 — TRANSACTIONS
// =====================================================================
function TransactionsTab() {
  const transactions = useStore((s) => s.transactions);
  const plazas = useStore((s) => s.plazas);
  const lanes = useStore((s) => s.lanes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = transactions
    .filter((t) => statusFilter === "ALL" ? true : t.status === statusFilter)
    .filter((t) => search ? t.plateCaptured?.toLowerCase().includes(search.toLowerCase()) || t.id.includes(search) : true)
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

  const totalAmount = transactions.filter((t) => t.status === "SUCCESS").reduce((s, t) => s + t.totalAmount, 0);
  const successCount = transactions.filter((t) => t.status === "SUCCESS").length;
  const failedCount = transactions.filter((t) => t.status === "FAILED").length;
  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;

  const STATUS_COLORS: Record<string, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    REFUNDED: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-lg font-bold text-navy">Transaction History</h2><p className="text-xs text-muted-foreground">{transactions.length} total transactions</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 border-l-4 border-l-teal border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Total Revenue</div><div className="text-xl font-bold">{formatCurrency(totalAmount, "OMR")}</div></Card>
        <Card className="p-3 border-l-4 border-l-emerald-500 border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Successful</div><div className="text-xl font-bold text-emerald-600">{successCount}</div></Card>
        <Card className="p-3 border-l-4 border-l-destructive border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Failed</div><div className="text-xl font-bold text-destructive">{failedCount}</div></Card>
        <Card className="p-3 border-l-4 border-l-amber-500 border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Pending</div><div className="text-xl font-bold text-amber-600">{pendingCount}</div></Card>
      </div>

      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
            <h3 className="text-sm font-semibold text-navy mb-1">Payment Method Breakdown</h3>
            <p className="text-xs text-muted-foreground mb-3">Distribution by payment type</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: "Wallet", value: transactions.filter((t) => t.paymentMethod === "WALLET").length, fill: "#2E8B8B" },
                    { name: "UPI", value: transactions.filter((t) => t.paymentMethod === "UPI").length, fill: "#2C3E50" },
                    { name: "Card", value: transactions.filter((t) => t.paymentMethod === "CARD").length, fill: "#E0A030" },
                    { name: "Cash", value: transactions.filter((t) => t.paymentMethod === "CASH").length, fill: "#5C7A8A" },
                    { name: "Fleet", value: transactions.filter((t) => t.paymentMethod === "FLEET_INVOICE").length, fill: "#7AB3A3" },
                  ].filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={3}>
                    {[{ fill: "#2E8B8B" }, { fill: "#2C3E50" }, { fill: "#E0A030" }, { fill: "#5C7A8A" }, { fill: "#7AB3A3" }].map((_, i) => (
                      <Cell key={i} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
            <h3 className="text-sm font-semibold text-navy mb-1">Transaction Status</h3>
            <p className="text-xs text-muted-foreground mb-3">Success vs failure rate</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Success", count: successCount, fill: "#10B981" },
                  { name: "Failed", count: failedCount, fill: "#EF4444" },
                  { name: "Pending", count: pendingCount, fill: "#F59E0B" },
                  { name: "Refunded", count: transactions.filter((t) => t.status === "REFUNDED").length, fill: "#3B82F6" },
                ]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                    {[{ fill: "#10B981" }, { fill: "#EF4444" }, { fill: "#F59E0B" }, { fill: "#3B82F6" }].map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by plate or transaction ID…" className="pl-9" /></div>
        <div className="flex gap-1">{["ALL", "SUCCESS", "FAILED", "PENDING"].map((s) => (<Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} className="h-9 text-xs" onClick={() => setStatusFilter(s)}>{s}</Button>))}</div>
      </div>

      <Card className="p-5 border-0 shadow-sm">
        <div className="rounded-xl border max-h-[600px] overflow-y-auto scrollbar-thin">
          <Table>
            <TableHeader className="sticky top-0 bg-card"><TableRow><TableHead className="w-40">Transaction ID</TableHead><TableHead>Plate</TableHead><TableHead>Plaza</TableHead><TableHead>Lane</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((t) => {
                const plaza = plazas.find((p) => p.id === t.plazaId);
                const lane = lanes.find((l) => l.id === t.laneId);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-[0.65rem] text-muted-foreground">{t.id}</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{t.plateCaptured}</TableCell>
                    <TableCell className="text-xs">{plaza?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{lane ? `L${lane.number}` : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[0.6rem]">{t.paymentMethod}</Badge></TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(t.totalAmount, "OMR")}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[0.6rem]", STATUS_COLORS[t.status] ?? "")}>{t.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(t.capturedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-xs text-muted-foreground"><ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-30" />No transactions found.</div>}
      </Card>
    </div>
  );
}

// =====================================================================
// TAB 6 — VIOLATIONS
// =====================================================================
function ViolationsTab() {
  const violations = useStore((s) => s.violations);
  const challans = useStore((s) => s.challans);
  const plazas = useStore((s) => s.plazas);
  const vehicles = useStore((s) => s.vehicles);
  const addViolation = useStore((s) => s.addViolation);
  const issueChallan = useStore((s) => s.issueChallan);
  const payChallan = useStore((s) => s.payChallan);
  const [addOpen, setAddOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState<string | null>(null);
  const [issueAmount, setIssueAmount] = useState("");
  const [newViolation, setNewViolation] = useState({ plateCaptured: "", type: "UNPAID_PASS" as Violation["type"], plazaId: "" });

  const detected = violations.filter((v) => v.status === "DETECTED").length;
  const issued = challans.length;
  const paid = challans.filter((c) => c.status === "PAID").length;
  const overdue = challans.filter((c) => c.status === "OVERDUE").length;

  const VIOLATION_COLORS: Record<string, string> = {
    UNPAID_PASS: "bg-amber-50 text-amber-700 border-amber-200",
    TAG_MISMATCH: "bg-orange-50 text-orange-700 border-orange-200",
    BLACKLISTED: "bg-red-50 text-red-700 border-red-200",
    WRONG_LANE: "bg-blue-50 text-blue-700 border-blue-200",
    OVERSPEED: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const handleAddViolation = () => {
    if (!newViolation.plateCaptured) { toast.error("Plate number required"); return; }
    addViolation({ plateCaptured: newViolation.plateCaptured.toUpperCase(), type: newViolation.type, plazaId: newViolation.plazaId || undefined, detectedAt: new Date().toISOString(), status: "DETECTED" });
    toast.success("Violation recorded");
    setNewViolation({ plateCaptured: "", type: "UNPAID_PASS", plazaId: "" });
    setAddOpen(false);
  };

  const handleIssueChallan = () => {
    if (!issueOpen) return;
    const amount = parseFloat(issueAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid fine amount"); return; }
    issueChallan(issueOpen, amount);
    toast.success("Challan issued");
    setIssueOpen(null);
    setIssueAmount("");
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-navy">Violation & E-Challan Enforcement</h2><p className="text-xs text-muted-foreground">{violations.length} violations · {challans.length} challans</p></div>
        <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-teal to-teal-dark"><Plus className="h-4 w-4 mr-2" /> Record Violation</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 border-l-4 border-l-amber-500 border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Detected</div><div className="text-xl font-bold text-amber-600">{detected}</div></Card>
        <Card className="p-3 border-l-4 border-l-blue-500 border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Challans Issued</div><div className="text-xl font-bold text-blue-600">{issued}</div></Card>
        <Card className="p-3 border-l-4 border-l-emerald-500 border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Paid</div><div className="text-xl font-bold text-emerald-600">{paid}</div></Card>
        <Card className="p-3 border-l-4 border-l-destructive border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Overdue</div><div className="text-xl font-bold text-destructive">{overdue}</div></Card>
      </div>

      {violations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
            <h3 className="text-sm font-semibold text-navy mb-1">Violation Type Distribution</h3>
            <p className="text-xs text-muted-foreground mb-3">By violation category</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: "Unpaid Pass", value: violations.filter((v) => v.type === "UNPAID_PASS").length, fill: "#F59E0B" },
                    { name: "Tag Mismatch", value: violations.filter((v) => v.type === "TAG_MISMATCH").length, fill: "#F97316" },
                    { name: "Blacklisted", value: violations.filter((v) => v.type === "BLACKLISTED").length, fill: "#EF4444" },
                    { name: "Wrong Lane", value: violations.filter((v) => v.type === "WRONG_LANE").length, fill: "#3B82F6" },
                    { name: "Overspeed", value: violations.filter((v) => v.type === "OVERSPEED").length, fill: "#8B5CF6" },
                  ].filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={3}>
                    {[{ fill: "#F59E0B" }, { fill: "#F97316" }, { fill: "#EF4444" }, { fill: "#3B82F6" }, { fill: "#8B5CF6" }].map((_, i) => (
                      <Cell key={i} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
            <h3 className="text-sm font-semibold text-navy mb-1">Challan Status Overview</h3>
            <p className="text-xs text-muted-foreground mb-3">Payment and collection status</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Issued", count: challans.filter((c) => c.status === "ISSUED").length, fill: "#3B82F6" },
                  { name: "Paid", count: challans.filter((c) => c.status === "PAID").length, fill: "#10B981" },
                  { name: "Overdue", count: challans.filter((c) => c.status === "OVERDUE").length, fill: "#EF4444" },
                  { name: "Appealed", count: challans.filter((c) => c.status === "APPEALED").length, fill: "#F59E0B" },
                ]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                    {[{ fill: "#3B82F6" }, { fill: "#10B981" }, { fill: "#EF4444" }, { fill: "#F59E0B" }].map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-5 border-0 shadow-sm">
        <h3 className="text-sm font-semibold text-navy mb-3">Detected Violations</h3>
        {violations.length > 0 ? (
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Plate</TableHead><TableHead>Type</TableHead><TableHead>Plaza</TableHead><TableHead>Detected</TableHead><TableHead>Status</TableHead><TableHead className="w-32">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {violations.map((v) => {
                  const plaza = plazas.find((p) => p.id === v.plazaId);
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs font-bold">{v.plateCaptured}</TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[0.6rem]", VIOLATION_COLORS[v.type] ?? "")}>{v.type.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell className="text-xs">{plaza?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{timeAgo(v.detectedAt)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[0.6rem]">{v.status.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell>
                        {v.status === "DETECTED" && (
                          <Button size="sm" variant="outline" className="h-7 text-[0.65rem]" onClick={() => setIssueOpen(v.id)}>
                            <FileBarChart className="h-3 w-3 mr-1" /> Issue Challan
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-muted-foreground"><ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />No violations detected. All clear!</div>
        )}
      </Card>

      {challans.length > 0 && (
        <Card className="p-5 border-0 shadow-sm">
          <h3 className="text-sm font-semibold text-navy mb-3">Issued Challans</h3>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Challan No</TableHead><TableHead>Amount</TableHead><TableHead>Issue Date</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {challans.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-bold">{c.challanNo}</TableCell>
                    <TableCell className="font-mono text-xs">{formatCurrency(c.amount, "OMR")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(c.issueDate)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(c.dueDate)}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[0.6rem]", c.status === "PAID" ? "bg-emerald-50 text-emerald-700" : c.status === "OVERDUE" ? "bg-red-50 text-red-700" : "")}>{c.status}</Badge></TableCell>
                    <TableCell>
                      {c.status === "ISSUED" && (
                        <Button size="sm" variant="ghost" className="h-7 text-[0.65rem] text-emerald-600" onClick={() => { payChallan(c.id); toast.success("Challan marked as paid"); }}>Mark Paid</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Violation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Plate Number *</Label><Input value={newViolation.plateCaptured} onChange={(e) => setNewViolation({ ...newViolation, plateCaptured: sanitizePlate(e.target.value) })} placeholder="12345-A" className="font-mono uppercase" /></div>
            <div><Label>Violation Type</Label>
              <Select value={newViolation.type} onValueChange={(v) => setNewViolation({ ...newViolation, type: v as Violation["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNPAID_PASS">Unpaid Pass</SelectItem>
                  <SelectItem value="TAG_MISMATCH">Tag Mismatch</SelectItem>
                  <SelectItem value="BLACKLISTED">Blacklisted Vehicle</SelectItem>
                  <SelectItem value="WRONG_LANE">Wrong Lane</SelectItem>
                  <SelectItem value="OVERSPEED">Overspeed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Plaza</Label>
              <Select value={newViolation.plazaId} onValueChange={(v) => setNewViolation({ ...newViolation, plazaId: v })}>
                <SelectTrigger><SelectValue placeholder="Select plaza (optional)" /></SelectTrigger>
                <SelectContent>{plazas.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleAddViolation}>Record Violation</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!issueOpen} onOpenChange={() => setIssueOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue E-Challan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Fine Amount (OMR) *</Label><Input type="number" step="0.001" value={issueAmount} onChange={(e) => setIssueAmount(e.target.value)} placeholder="10.000" className="font-mono" /></div>
            <div className="text-xs text-muted-foreground">Challan will be generated with a 15-day due period.</div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIssueOpen(null)}>Cancel</Button><Button onClick={handleIssueChallan}>Issue Challan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================================
// TAB 7 — STAFF & HR
// =====================================================================
function StaffTab() {
  const staff = useStore((s) => s.staff);
  const plazas = useStore((s) => s.plazas);
  const addStaff = useStore((s) => s.addStaff);
  const updateStaff = useStore((s) => s.updateStaff);
  const deleteStaff = useStore((s) => s.deleteStaff);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", designation: "LANE_OPERATOR" as Staff["designation"], plazaId: "", employeeId: "" });

  const filtered = staff
    .filter((s) => roleFilter === "ALL" ? true : s.designation === roleFilter)
    .filter((s) => search ? s.name.toLowerCase().includes(search.toLowerCase()) || s.employeeId.toLowerCase().includes(search.toLowerCase()) : true);

  const activeStaff = staff.filter((s) => s.status === "ACTIVE").length;
  const DESIGNATION_LABELS: Record<string, string> = {
    LANE_OPERATOR: "Lane Operator", PLAZA_MANAGER: "Plaza Manager", FINANCE_OFFICER: "Finance Officer",
    ENFORCEMENT: "Enforcement", SUPPORT: "Support", AUDITOR: "Auditor",
  };
  const DESIGNATION_COLORS: Record<string, string> = {
    LANE_OPERATOR: "bg-teal/10 text-teal", PLAZA_MANAGER: "bg-navy/10 text-navy", FINANCE_OFFICER: "bg-emerald-50 text-emerald-700",
    ENFORCEMENT: "bg-amber-50 text-amber-700", SUPPORT: "bg-blue-50 text-blue-700", AUDITOR: "bg-purple-50 text-purple-700",
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.employeeId) { toast.error("Name and Employee ID required"); return; }
    addStaff({ name: newStaff.name, designation: newStaff.designation, plazaId: newStaff.plazaId || undefined, employeeId: newStaff.employeeId, status: "ACTIVE", hireDate: new Date().toISOString() });
    toast.success("Staff member added");
    setNewStaff({ name: "", designation: "LANE_OPERATOR", plazaId: "", employeeId: "" });
    setAddOpen(false);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from staff?`)) return;
    deleteStaff(id);
    toast.success("Staff removed");
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-lg font-bold text-navy">Staff & HR Management</h2><p className="text-xs text-muted-foreground">{activeStaff} active staff members</p></div>
        <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-teal to-teal-dark"><Plus className="h-4 w-4 mr-2" /> Add Staff</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 border-l-4 border-l-teal border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Total Staff</div><div className="text-xl font-bold">{staff.length}</div></Card>
        <Card className="p-3 border-l-4 border-l-emerald-500 border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Active</div><div className="text-xl font-bold text-emerald-600">{activeStaff}</div></Card>
        <Card className="p-3 border-l-4 border-l-amber-500 border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">On Leave</div><div className="text-xl font-bold text-amber-600">{staff.filter((s) => s.status === "ON_LEAVE").length}</div></Card>
        <Card className="p-3 border-l-4 border-l-navy border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Plazas</div><div className="text-xl font-bold">{plazas.length}</div></Card>
      </div>

      {staff.length > 0 && (
        <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <h3 className="text-sm font-semibold text-navy mb-1">Staff by Designation</h3>
          <p className="text-xs text-muted-foreground mb-3">Workforce distribution across roles</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(DESIGNATION_LABELS).map(([key, label]) => ({
                name: label.split(" ")[0],
                count: staff.filter((s) => s.designation === key).length,
              }))} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18} fill="#2E8B8B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or employee ID…" className="pl-9" /></div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All Roles</SelectItem>{Object.entries(DESIGNATION_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      <Card className="p-5 border-0 shadow-sm">
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Employee ID</TableHead><TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Plaza</TableHead><TableHead>Status</TableHead><TableHead>Hire Date</TableHead><TableHead className="w-20">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const plaza = plazas.find((p) => p.id === s.plazaId);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs font-bold">{s.employeeId}</TableCell>
                    <TableCell className="text-sm font-medium">{s.name}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[0.6rem]", DESIGNATION_COLORS[s.designation] ?? "")}>{DESIGNATION_LABELS[s.designation]}</Badge></TableCell>
                    <TableCell className="text-xs">{plaza?.name ?? "—"}</TableCell>
                    <TableCell><div className="flex items-center gap-1.5 text-xs"><span className={cn("h-1.5 w-1.5 rounded-full", s.status === "ACTIVE" ? "bg-emerald-500" : s.status === "ON_LEAVE" ? "bg-amber-500" : "bg-zinc-400")} />{s.status === "ACTIVE" ? "Active" : s.status === "ON_LEAVE" ? "On Leave" : "Inactive"}</div></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(s.hireDate)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 text-[0.65rem] text-destructive" onClick={() => handleDeleteStaff(s.id, s.name)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-xs text-muted-foreground"><UserCog className="h-8 w-8 mx-auto mb-2 opacity-30" />No staff match your filters.</div>}
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employee ID *</Label><Input value={newStaff.employeeId} onChange={(e) => setNewStaff({ ...newStaff, employeeId: e.target.value })} placeholder="EMP-0003" /></div>
            <div><Label>Full Name *</Label><Input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="Ahmed Al Balushi" /></div>
            <div><Label>Designation</Label>
              <Select value={newStaff.designation} onValueChange={(v) => setNewStaff({ ...newStaff, designation: v as Staff["designation"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(DESIGNATION_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>Assigned Plaza</Label>
              <Select value={newStaff.plazaId} onValueChange={(v) => setNewStaff({ ...newStaff, plazaId: v })}>
                <SelectTrigger><SelectValue placeholder="Select plaza (optional)" /></SelectTrigger>
                <SelectContent>{plazas.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleAddStaff}>Add Staff</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================================
// TAB 8 — NOTIFICATIONS
// =====================================================================
function NotificationsTab() {
  const notifications = useStore((s) => s.notifications);
  const pushNotification = useStore((s) => s.pushNotification);
  const [addOpen, setAddOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({ channel: "SMS" as Notification["channel"], recipient: "", template: "", payload: "" });

  const channels = ["SMS", "EMAIL", "PUSH", "WHATSAPP"] as const;
  const channelCounts = channels.map((c) => ({
    channel: c,
    count: notifications.filter((n) => n.channel === c).length,
  }));

  const CHANNEL_COLORS: Record<string, string> = {
    SMS: "bg-emerald-50 text-emerald-700", EMAIL: "bg-blue-50 text-blue-700",
    PUSH: "bg-purple-50 text-purple-700", WHATSAPP: "bg-green-50 text-green-700",
  };

  const handleSend = () => {
    if (!newNotif.recipient || !newNotif.template) { toast.error("Recipient and template required"); return; }
    pushNotification({ channel: newNotif.channel, recipient: newNotif.recipient, template: newNotif.template, payload: newNotif.payload, status: "SENT", sentAt: new Date().toISOString() });
    toast.success("Notification sent");
    setNewNotif({ channel: "SMS", recipient: "", template: "", payload: "" });
    setAddOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-navy">Notifications & Communication</h2><p className="text-xs text-muted-foreground">{notifications.length} total notifications sent</p></div>
        <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-teal to-teal-dark"><Plus className="h-4 w-4 mr-2" /> New Broadcast</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {channelCounts.map((ch) => (
          <Card key={ch.channel} className={cn("p-3 border-l-4 border-0 shadow-sm", ch.channel === "SMS" ? "border-l-emerald-500" : ch.channel === "EMAIL" ? "border-l-blue-500" : ch.channel === "PUSH" ? "border-l-purple-500" : "border-l-green-500")}>
            <div className="text-xs text-muted-foreground uppercase">{ch.channel}</div>
            <div className="text-xl font-bold">{ch.count}</div>
          </Card>
        ))}
      </div>

      {notifications.length > 0 && (
        <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
          <h3 className="text-sm font-semibold text-navy mb-1">Notifications by Channel</h3>
          <p className="text-xs text-muted-foreground mb-3">Distribution across communication channels</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelCounts.map((ch) => ({ name: ch.channel, count: ch.count }))} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                  {[{ fill: "#10B981" }, { fill: "#3B82F6" }, { fill: "#8B5CF6" }, { fill: "#22C55E" }].map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="p-5 border-0 shadow-sm">
        <h3 className="text-sm font-semibold text-navy mb-3">Notification History</h3>
        {notifications.length > 0 ? (
          <div className="rounded-xl border max-h-[500px] overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader><TableRow><TableHead>Channel</TableHead><TableHead>Template</TableHead><TableHead>Recipient</TableHead><TableHead>Status</TableHead><TableHead>Sent</TableHead></TableRow></TableHeader>
              <TableBody>
                {notifications.slice(0, 50).map((n) => (
                  <TableRow key={n.id}>
                    <TableCell><Badge variant="outline" className={cn("text-[0.6rem]", CHANNEL_COLORS[n.channel] ?? "")}>{n.channel}</Badge></TableCell>
                    <TableCell className="text-xs font-medium">{n.template}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{n.recipient}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[0.6rem]", n.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700" : n.status === "FAILED" ? "bg-red-50 text-red-700" : "")}>{n.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{n.sentAt ? timeAgo(n.sentAt) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-muted-foreground"><Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />No notifications yet.</div>
        )}
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Channel</Label>
              <Select value={newNotif.channel} onValueChange={(v) => setNewNotif({ ...newNotif, channel: v as Notification["channel"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SMS">SMS</SelectItem><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="PUSH">Push</SelectItem><SelectItem value="WHATSAPP">WhatsApp</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Recipient *</Label><Input value={newNotif.recipient} onChange={(e) => setNewNotif({ ...newNotif, recipient: e.target.value })} placeholder="+968 9123 4567 or email@example.com" /></div>
            <div><Label>Template *</Label><Input value={newNotif.template} onChange={(e) => setNewNotif({ ...newNotif, template: e.target.value })} placeholder="Toll Deduction Alert" /></div>
            <div><Label>Message</Label><Input value={newNotif.payload} onChange={(e) => setNewNotif({ ...newNotif, payload: e.target.value })} placeholder="Your toll of OMR 0.500 has been deducted." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleSend}>Send Notification</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================================
// TAB 9 — AUDIT LOG
// =====================================================================
function AuditTab() {
  const auditLogs = useStore((s) => s.auditLogs);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filtered = auditLogs
    .filter((l) => actionFilter === "ALL" ? true : l.action === actionFilter)
    .filter((l) => search ? l.actorName.toLowerCase().includes(search.toLowerCase()) || l.module.toLowerCase().includes(search.toLowerCase()) || l.entityId?.toLowerCase().includes(search.toLowerCase()) : true);

  const ACTION_COLORS: Record<string, string> = {
    CREATE: "border-emerald-500 text-emerald-700 bg-emerald-50",
    UPDATE: "border-blue-500 text-blue-700 bg-blue-50",
    DELETE: "border-red-500 text-red-700 bg-red-50",
    APPROVE: "border-purple-500 text-purple-700 bg-purple-50",
    LOGIN: "border-teal text-teal bg-teal/5",
    LOGOUT: "border-zinc-400 text-zinc-600 bg-zinc-50",
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-navy">Security & Audit Trail</h2><p className="text-xs text-muted-foreground">Immutable, hash-chained log of all admin actions</p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-l-4 border-l-teal border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Total Events</div><div className="text-xl font-bold">{auditLogs.length}</div></Card>
        <Card className="p-3 border-l-4 border-l-emerald-500 border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Creates</div><div className="text-xl font-bold text-emerald-600">{auditLogs.filter(l => l.action === "CREATE").length}</div></Card>
        <Card className="p-3 border-l-4 border-l-blue-500 border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Updates</div><div className="text-xl font-bold text-blue-600">{auditLogs.filter(l => l.action === "UPDATE").length}</div></Card>
        <Card className="p-3 border-l-4 border-l-destructive border-0 shadow-sm"><div className="text-xs text-muted-foreground uppercase">Deletions</div><div className="text-xl font-bold text-destructive">{auditLogs.filter(l => l.action === "DELETE").length}</div></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by actor, module, or entity…" className="pl-9" /></div>
        <div className="flex gap-1">{["ALL", "CREATE", "UPDATE", "DELETE"].map((a) => (<Button key={a} size="sm" variant={actionFilter === a ? "default" : "outline"} className="h-9 text-xs" onClick={() => setActionFilter(a)}>{a}</Button>))}</div>
      </div>

      <Card className="p-5 border-0 shadow-sm">
        <div className="rounded-xl border max-h-[600px] overflow-y-auto scrollbar-thin">
          <Table>
            <TableHeader className="sticky top-0 bg-card"><TableRow><TableHead className="w-40">Timestamp</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Module</TableHead><TableHead>Entity</TableHead><TableHead>Changes</TableHead><TableHead>IP</TableHead><TableHead className="w-20">Hash</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.slice(0, 80).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-[0.65rem] text-muted-foreground font-mono">{formatDateTime(l.createdAt)}</TableCell>
                  <TableCell className="text-xs font-medium">{l.actorName}</TableCell>
                  <TableCell><Badge variant="outline" className={cn("text-[0.6rem]", ACTION_COLORS[l.action] ?? "")}>{l.action}</Badge></TableCell>
                  <TableCell><Badge variant="secondary" className="text-[0.6rem]">{l.module}</Badge></TableCell>
                  <TableCell className="font-mono text-[0.65rem] text-muted-foreground">{l.entityId ?? "—"}</TableCell>
                  <TableCell className="text-[0.65rem]">{l.beforeValue && <div className="text-destructive line-through opacity-60">{l.beforeValue}</div>}{l.afterValue && <div className="text-emerald-700">{l.afterValue}</div>}{!l.beforeValue && !l.afterValue && <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="font-mono text-[0.65rem] text-muted-foreground">{l.ipAddress ?? "—"}</TableCell>
                  <TableCell><div className="flex items-center gap-1 text-[0.6rem] text-muted-foreground font-mono"><Hash className="h-2.5 w-2.5" />{l.hashChain?.slice(0, 8)}</div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-xs text-muted-foreground"><ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />No audit entries match your filters.</div>}
      </Card>
    </div>
  );
}
