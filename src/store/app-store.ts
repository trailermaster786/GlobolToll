"use client";
import { create } from "zustand";
import type {
  AppState,
  AuditLog,
  Highway,
  Lane,
  ModuleKey,
  Notification,
  RateCard,
  Settlement,
  TollPlaza,
  Transaction,
  Violation,
  Challan,
  Device,
  Vehicle,
  Tag,
  Wallet,
  Staff,
  Tenant,
  User,
  SupportTicket,
  CorporateAccount,
  Invoice,
} from "@/lib/types";
import { initialState } from "@/lib/seed-data";

interface StoreActions {
  // Auth
  login: (userId: string) => void;
  logout: () => void;
  setActiveModule: (m: ModuleKey) => void;
  switchTenant: (tenantId: string) => void;

  // Tenants
  addTenant: (data: Omit<Tenant, "id" | "createdAt">) => void;

  // Highways
  addHighway: (data: Omit<Highway, "id" | "tenantId">) => void;
  updateHighway: (id: string, data: Partial<Highway>) => void;
  deleteHighway: (id: string) => void;

  // Plazas
  addPlaza: (data: Omit<TollPlaza, "id" | "tenantId">) => void;
  updatePlaza: (id: string, data: Partial<TollPlaza>) => void;
  deletePlaza: (id: string) => void;

  // Lanes
  addLane: (data: Omit<Lane, "id">) => void;
  updateLane: (id: string, data: Partial<Lane>) => void;
  deleteLane: (id: string) => void;

  // Devices
  addDevice: (data: Omit<Device, "id">) => void;
  updateDevice: (id: string, data: Partial<Device>) => void;
  deleteDevice: (id: string) => void;

  // Vehicles
  addVehicle: (data: Omit<Vehicle, "id" | "tenantId" | "createdAt">) => void;
  updateVehicle: (id: string, data: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  // Tags
  addTag: (data: Omit<Tag, "id">) => void;
  updateTag: (id: string, data: Partial<Tag>) => void;
  deleteTag: (id: string) => void;

  // Wallets
  addWallet: (data: Omit<Wallet, "id">) => void;
  updateWallet: (id: string, data: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  topUpWallet: (id: string, amount: number) => void;

  // Rate Cards
  addRateCard: (data: Omit<RateCard, "id" | "tenantId" | "createdAt">) => void;
  updateRateCard: (id: string, data: Partial<RateCard>) => void;
  deleteRateCard: (id: string) => void;

  // Transactions
  addTransaction: (txn: Transaction) => void;

  // Settlements
  addSettlement: (data: Omit<Settlement, "id" | "tenantId">) => void;
  lockSettlement: (id: string, actor: string) => void;

  // Violations
  addViolation: (data: Omit<Violation, "id" | "tenantId">) => void;
  updateViolation: (id: string, data: Partial<Violation>) => void;

  // Challans
  issueChallan: (violationId: string, amount: number) => void;
  payChallan: (challanId: string) => void;
  updateChallan: (id: string, data: Partial<Challan>) => void;

  // Staff
  addStaff: (data: Omit<Staff, "id" | "tenantId">) => void;
  updateStaff: (id: string, data: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;

  // Users
  addUser: (data: Omit<User, "id" | "tenantId" | "lastLoginAt">) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Notifications
  pushNotification: (n: Omit<Notification, "id" | "createdAt">) => void;
  deleteNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;

  // Support Tickets
  addTicket: (data: Omit<SupportTicket, "id" | "tenantId" | "createdAt">) => void;
  updateTicket: (id: string, data: Partial<SupportTicket>) => void;
  deleteTicket: (id: string) => void;

  // Corporate Accounts
  addCorporateAccount: (data: Omit<CorporateAccount, "id" | "tenantId" | "createdAt">) => void;
  updateCorporateAccount: (id: string, data: Partial<CorporateAccount>) => void;
  deleteCorporateAccount: (id: string) => void;

  // Invoices
  addInvoice: (data: Omit<Invoice, "id">) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Audit
  pushAudit: (entry: Omit<AuditLog, "id" | "createdAt" | "hashChain">) => void;

  // Reset
  reset: () => void;
}

type Store = AppState & StoreActions;

let auditHashChain = "0".repeat(64);
function nextHash(prev: string, payload: string) {
  let h = 0;
  const c = prev + payload;
  for (let i = 0; i < c.length; i++) h = ((h << 5) - h + c.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0").repeat(8);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useStore = create<Store>((set, get) => ({
  ...initialState,

  // ── Auth ────────────────────────────────────────────────────────────
  login: (userId) => {
    const u = get().users.find((x) => x.id === userId);
    if (!u) return;
    get().pushAudit({
      tenantId: u.tenantId,
      userId: u.id,
      actorName: u.name,
      action: "LOGIN",
      module: "admin",
      ipAddress: "127.0.0.1",
    });
    set({ currentUser: u, activeModule: "dashboard" });
  },

  logout: () => {
    const u = get().currentUser;
    if (u) {
      get().pushAudit({
        tenantId: u.tenantId,
        userId: u.id,
        actorName: u.name,
        action: "LOGOUT",
        module: "admin",
        ipAddress: "127.0.0.1",
      });
    }
    set({ currentUser: null, activeModule: "dashboard" });
  },

  setActiveModule: (m) => set({ activeModule: m }),

  switchTenant: (tenantId) => set({ currentTenantId: tenantId }),

  // ── Tenants ─────────────────────────────────────────────────────────
  addTenant: (data) => {
    const item: Tenant = { id: uid("tnt"), createdAt: new Date().toISOString(), ...data };
    set((s) => ({ tenants: [...s.tenants, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "admin", entityType: "tenant", entityId: item.id, afterValue: JSON.stringify(data) });
  },

  // ── Highways ────────────────────────────────────────────────────────
  addHighway: (data) => {
    const item: Highway = { id: uid("hw"), tenantId: get().currentTenantId, ...data };
    set((s) => ({ highways: [...s.highways, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "plazas", entityType: "highway", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateHighway: (id, data) => {
    const before = get().highways.find((x) => x.id === id);
    set((s) => ({ highways: s.highways.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "UPDATE", module: "plazas", entityType: "highway", entityId: id, beforeValue: JSON.stringify(before), afterValue: JSON.stringify(data) });
  },
  deleteHighway: (id) => {
    set((s) => ({ highways: s.highways.filter((x) => x.id !== id) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "DELETE", module: "plazas", entityType: "highway", entityId: id });
  },

  // ── Plazas ──────────────────────────────────────────────────────────
  addPlaza: (data) => {
    const item: TollPlaza = { id: uid("plz"), tenantId: get().currentTenantId, ...data };
    set((s) => ({ plazas: [...s.plazas, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "plazas", entityType: "plaza", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updatePlaza: (id, data) => {
    set((s) => ({ plazas: s.plazas.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "UPDATE", module: "plazas", entityType: "plaza", entityId: id, afterValue: JSON.stringify(data) });
  },
  deletePlaza: (id) => {
    set((s) => ({ plazas: s.plazas.filter((x) => x.id !== id) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "DELETE", module: "plazas", entityType: "plaza", entityId: id });
  },

  // ── Lanes ───────────────────────────────────────────────────────────
  addLane: (data) => {
    const item: Lane = { id: uid("lane"), ...data, updatedAt: new Date().toISOString() };
    set((s) => ({ lanes: [...s.lanes, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "plazas", entityType: "lane", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateLane: (id, data) => {
    set((s) => ({ lanes: s.lanes.map((x) => (x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x)) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "UPDATE", module: "plazas", entityType: "lane", entityId: id, afterValue: JSON.stringify(data) });
  },
  deleteLane: (id) => {
    set((s) => ({ lanes: s.lanes.filter((x) => x.id !== id) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "DELETE", module: "plazas", entityType: "lane", entityId: id });
  },

  // ── Devices ─────────────────────────────────────────────────────────
  addDevice: (data) => {
    const item: Device = { id: uid("dev"), ...data };
    set((s) => ({ devices: [...s.devices, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "plazas", entityType: "device", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateDevice: (id, data) => {
    set((s) => ({ devices: s.devices.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "UPDATE", module: "plazas", entityType: "device", entityId: id, afterValue: JSON.stringify(data) });
  },
  deleteDevice: (id) => {
    set((s) => ({ devices: s.devices.filter((x) => x.id !== id) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "DELETE", module: "plazas", entityType: "device", entityId: id });
  },

  // ── Vehicles ────────────────────────────────────────────────────────
  addVehicle: (data) => {
    const item: Vehicle = { id: uid("veh"), tenantId: get().currentTenantId, createdAt: new Date().toISOString(), ...data };
    set((s) => ({ vehicles: [...s.vehicles, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "vehicles", entityType: "vehicle", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateVehicle: (id, data) => {
    set((s) => ({ vehicles: s.vehicles.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "UPDATE", module: "vehicles", entityType: "vehicle", entityId: id, afterValue: JSON.stringify(data) });
  },
  deleteVehicle: (id) => {
    set((s) => ({ vehicles: s.vehicles.filter((x) => x.id !== id) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "DELETE", module: "vehicles", entityType: "vehicle", entityId: id });
  },

  // ── Tags ────────────────────────────────────────────────────────────
  addTag: (data) => {
    const item: Tag = { id: uid("tag"), ...data };
    set((s) => ({ tags: [...s.tags, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "vehicles", entityType: "tag", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateTag: (id, data) => {
    set((s) => ({ tags: s.tags.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },
  deleteTag: (id) => {
    set((s) => ({ tags: s.tags.filter((x) => x.id !== id) }));
  },

  // ── Wallets ─────────────────────────────────────────────────────────
  addWallet: (data) => {
    const item: Wallet = { id: uid("wlt"), ...data };
    set((s) => ({ wallets: [...s.wallets, item] }));
  },
  updateWallet: (id, data) => {
    set((s) => ({ wallets: s.wallets.map((x) => (x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x)) }));
  },
  deleteWallet: (id) => {
    set((s) => ({ wallets: s.wallets.filter((x) => x.id !== id) }));
  },
  topUpWallet: (id, amount) => {
    set((s) => ({
      wallets: s.wallets.map((w) =>
        w.id === id ? { ...w, balance: +(w.balance + amount).toFixed(3), updatedAt: new Date().toISOString() } : w
      ),
    }));
  },

  // ── Rate Cards ──────────────────────────────────────────────────────
  addRateCard: (data) => {
    const item: RateCard = { id: uid("rc"), tenantId: get().currentTenantId, createdAt: new Date().toISOString(), ...data };
    set((s) => ({ rateCards: [...s.rateCards, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "pricing", entityType: "rateCard", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateRateCard: (id, data) => {
    set((s) => ({ rateCards: s.rateCards.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "UPDATE", module: "pricing", entityType: "rateCard", entityId: id, afterValue: JSON.stringify(data) });
  },
  deleteRateCard: (id) => {
    set((s) => ({ rateCards: s.rateCards.filter((x) => x.id !== id) }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "DELETE", module: "pricing", entityType: "rateCard", entityId: id });
  },

  // ── Transactions ────────────────────────────────────────────────────
  addTransaction: (txn) =>
    set((s) => ({ transactions: [txn, ...s.transactions] })),

  // ── Settlements ─────────────────────────────────────────────────────
  addSettlement: (data) => {
    const item: Settlement = { id: uid("set"), tenantId: get().currentTenantId, ...data };
    set((s) => ({ settlements: [...s.settlements, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "settlement", entityType: "settlement", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  lockSettlement: (id, actor) =>
    set((s) => ({
      settlements: s.settlements.map((st) =>
        st.id === id ? { ...st, status: "LOCKED", lockedAt: new Date().toISOString(), lockedBy: actor } : st
      ),
    })),

  // ── Violations ──────────────────────────────────────────────────────
  addViolation: (data) => {
    const item: Violation = { id: uid("vi"), tenantId: get().currentTenantId, ...data };
    set((s) => ({ violations: [...s.violations, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "violations", entityType: "violation", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateViolation: (id, data) => {
    set((s) => ({ violations: s.violations.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },

  // ── Challans ────────────────────────────────────────────────────────
  issueChallan: (violationId, amount) => {
    const v = get().violations.find((x) => x.id === violationId);
    if (!v) return;
    const c: Challan = {
      id: uid("chl"),
      violationId,
      challanNo: `CHL-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      amount,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 15 * 86400_000).toISOString(),
      status: "ISSUED",
    };
    set((s) => ({
      challans: [c, ...s.challans],
      violations: s.violations.map((x) => (x.id === violationId ? { ...x, status: "CHALLAN_ISSUED" as const } : x)),
    }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "Enforcement", action: "CREATE", module: "violations", entityType: "challan", entityId: c.id, afterValue: JSON.stringify({ amount }) });
  },
  payChallan: (challanId) =>
    set((s) => ({
      challans: s.challans.map((c) =>
        c.id === challanId ? { ...c, status: "PAID" as const, paidDate: new Date().toISOString() } : c
      ),
    })),
  updateChallan: (id, data) => {
    set((s) => ({ challans: s.challans.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },

  // ── Staff ───────────────────────────────────────────────────────────
  addStaff: (data) => {
    const item: Staff = { id: uid("stf"), tenantId: get().currentTenantId, ...data };
    set((s) => ({ staff: [...s.staff, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "staff", entityType: "staff", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateStaff: (id, data) => {
    set((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },
  deleteStaff: (id) => {
    set((s) => ({ staff: s.staff.filter((x) => x.id !== id) }));
  },

  // ── Users ───────────────────────────────────────────────────────────
  addUser: (data) => {
    const item: User = { id: uid("usr"), tenantId: get().currentTenantId, lastLoginAt: new Date().toISOString(), ...data };
    set((s) => ({ users: [...s.users, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "staff", entityType: "user", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateUser: (id, data) => {
    set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },
  deleteUser: (id) => {
    set((s) => ({ users: s.users.filter((x) => x.id !== id) }));
  },

  // ── Notifications ───────────────────────────────────────────────────
  pushNotification: (n) =>
    set((s) => ({
      notifications: [{ id: uid("ntf"), createdAt: new Date().toISOString(), ...n }, ...s.notifications].slice(0, 500),
    })),
  deleteNotification: (id) => {
    set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) }));
  },
  markNotificationRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((x) => (x.id === id ? { ...x, status: "DELIVERED" as const } : x)),
    }));
  },

  // ── Support Tickets ─────────────────────────────────────────────────
  addTicket: (data) => {
    const item: SupportTicket = { id: uid("tkt"), tenantId: get().currentTenantId, createdAt: new Date().toISOString(), ...data };
    set((s) => ({ supportTickets: [...s.supportTickets, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "customer", entityType: "ticket", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateTicket: (id, data) => {
    set((s) => ({ supportTickets: s.supportTickets.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },
  deleteTicket: (id) => {
    set((s) => ({ supportTickets: s.supportTickets.filter((x) => x.id !== id) }));
  },

  // ── Corporate Accounts ──────────────────────────────────────────────
  addCorporateAccount: (data) => {
    const item: CorporateAccount = { id: uid("corp"), tenantId: get().currentTenantId, createdAt: new Date().toISOString(), ...data };
    set((s) => ({ corporateAccounts: [...s.corporateAccounts, item] }));
    get().pushAudit({ actorName: get().currentUser?.name ?? "System", action: "CREATE", module: "customer", entityType: "corporate", entityId: item.id, afterValue: JSON.stringify(data) });
  },
  updateCorporateAccount: (id, data) => {
    set((s) => ({ corporateAccounts: s.corporateAccounts.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },
  deleteCorporateAccount: (id) => {
    set((s) => ({ corporateAccounts: s.corporateAccounts.filter((x) => x.id !== id) }));
  },

  // ── Invoices ────────────────────────────────────────────────────────
  addInvoice: (data) => {
    const item: Invoice = { id: uid("inv"), ...data };
    set((s) => ({ invoices: [...s.invoices, item] }));
  },
  updateInvoice: (id, data) => {
    set((s) => ({ invoices: s.invoices.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },
  deleteInvoice: (id) => {
    set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) }));
  },

  // ── Audit ───────────────────────────────────────────────────────────
  pushAudit: (entry) =>
    set((s) => {
      const createdAt = new Date().toISOString();
      const payload = `${entry.actorName}|${entry.action}|${entry.module}|${createdAt}`;
      const hash = nextHash(auditHashChain, payload);
      auditHashChain = hash;
      const log: AuditLog = { id: uid("aud"), createdAt, hashChain: hash, ...entry };
      return { auditLogs: [log, ...s.auditLogs].slice(0, 500) };
    }),

  // ── Reset ───────────────────────────────────────────────────────────
  reset: () => set({ ...initialState, currentUser: null }),
}));

export const useCurrentUser = () => useStore((s) => s.currentUser);
export const useActiveTenant = () => useStore((s) => s.tenants.find((t) => t.id === s.currentTenantId));

export function roleLabel(r: string): string {
  const map: Record<string, string> = { ADMIN: "Administrator", OPERATOR: "Lane Operator" };
  return map[r] ?? r;
}
