// =====================================================================
// Global Toll — Fresh Application State
// Only reference data (vehicle classes) + default user accounts.
// Everything else is created by users through the application.
// =====================================================================
import type {
  AppState,
  AuditLog,
  Device,
  Highway,
  Lane,
  RateCard,
  TollPlaza,
  Transaction,
  User,
  Vehicle,
  VehicleClass,
  Notification,
  Settlement,
  Violation,
  Challan,
  Tag,
  Wallet,
  Staff,
  SupportTicket,
  CorporateAccount,
  Invoice,
  DiscountPlan,
  RateRule,
  Tenant,
} from "./types";

const now = Date.now();
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

// ---- Default tenant (created on first run) --------------------------
const tenants: Tenant[] = [
  {
    id: "tnt-1",
    name: "Oman Toll Operations",
    legalName: "Oman Toll Operations LLC",
    taxId: "OM-1234567",
    countryCode: "OM",
    currency: "OMR",
    timezone: "Asia/Muscat",
    status: "ACTIVE",
    subscriptionTier: "ENTERPRISE",
    createdAt: iso(0),
  },
];

// ---- Vehicle classes (reference data — cannot be deleted) -----------
const vehicleClasses: VehicleClass[] = [
  { code: "TWO_WHEELER", label: "Motorcycle / Scooter", axleCount: 2, description: "Private 2-wheeler" },
  { code: "CAR", label: "Private Car / SUV", axleCount: 2, description: "Light motor vehicle ≤ 3.5T" },
  { code: "LCV", label: "Light Commercial Vehicle", axleCount: 2, description: "Pickup / small truck" },
  { code: "BUS", label: "Bus (Stage / Tourist)", axleCount: 2, description: "Public transport carrier" },
  { code: "HCV", label: "Heavy Commercial Vehicle", axleCount: 3, description: "Heavy truck / tractor" },
  { code: "MULTI_AXLE", label: "Multi-Axle Truck", axleCount: 4, description: "4+ axle goods carrier" },
  { code: "OVERSIZED", label: "Oversized Load", axleCount: 6, description: "Special-permit cargo" },
];

// ---- Default user accounts (admin + operator) -----------------------
const users: User[] = [
  {
    id: "usr-admin",
    tenantId: "tnt-1",
    email: "admin123",
    password: "12345678",
    name: "Admin User",
    role: "ADMIN",
    mfaEnabled: false,
    lastLoginAt: iso(0),
    status: "ACTIVE",
  },
  {
    id: "usr-operator",
    tenantId: "tnt-1",
    email: "lane123@gmail.com",
    password: "87654321",
    name: "Lane Operator",
    role: "OPERATOR",
    mfaEnabled: false,
    lastLoginAt: iso(0),
    status: "ACTIVE",
  },
];

// ---- Highways --------------------------------------------------------
const highways: Highway[] = [
  { id: "hw-1", tenantId: "tnt-1", code: "MQ-SL", name: "Muscat — Salalah Highway", lengthKm: 1025, region: "Al Dhofar / Muscat" },
];

// ---- Plazas (4 plazas × 4 lanes each) --------------------------------
const plazas: TollPlaza[] = [
  { id: "plz-1", highwayId: "hw-1", tenantId: "tnt-1", code: "TP-001", name: "Salalah Plaza", kmMark: 980, latitude: 17.0151, longitude: 54.0924, direction: "BOTH", status: "OPEN" },
  { id: "plz-2", highwayId: "hw-1", tenantId: "tnt-1", code: "TP-002", name: "Sohar Plaza", kmMark: 320, latitude: 24.3644, longitude: 56.7469, direction: "BOTH", status: "OPEN" },
  { id: "plz-3", highwayId: "hw-1", tenantId: "tnt-1", code: "TP-003", name: "Muscat Plaza", kmMark: 10, latitude: 23.5880, longitude: 58.3829, direction: "BOTH", status: "OPEN" },
  { id: "plz-4", highwayId: "hw-1", tenantId: "tnt-1", code: "TP-004", name: "Barka Plaza", kmMark: 75, latitude: 23.6848, longitude: 57.8909, direction: "BOTH", status: "OPEN" },
];

// ---- Lanes (4 plazas × 4 lanes = 16 lanes) ---------------------------
const laneTypes: Lane["type"][] = ["ETC_RFID", "CASH", "HYBRID", "EXPRESS_HOV"];
const laneDirections: Lane["direction"][] = ["FORWARD", "FORWARD", "REVERSE", "REVERSE"];
const lanes: Lane[] = [];
plazas.forEach((plz) => {
  for (let i = 1; i <= 4; i++) {
    lanes.push({
      id: `lane-${plz.id}-${i}`,
      plazaId: plz.id,
      number: i,
      type: laneTypes[i - 1],
      direction: laneDirections[i - 1],
      status: "OPEN",
      updatedAt: iso(0),
    });
  }
});

// ---- Devices (one per lane) -------------------------------------------
const devices: Device[] = [];
lanes.forEach((ln) => {
  devices.push({
    id: `dev-${ln.id}-RFID`,
    laneId: ln.id,
    type: "RFID_READER",
    serialNo: `RFID-${ln.plazaId.toUpperCase()}-${ln.number}`,
    vendor: "Kapsch",
    status: "ONLINE",
    lastHeartbeat: iso(0),
    firmware: "v3.2.0",
  });
  devices.push({
    id: `dev-${ln.id}-ANPR`,
    laneId: ln.id,
    type: "ANPR_CAMERA",
    serialNo: `ANPR-${ln.plazaId.toUpperCase()}-${ln.number}`,
    vendor: "Hikvision",
    status: "ONLINE",
    lastHeartbeat: iso(0),
    firmware: "v2.1.0",
  });
});
const vehicles: Vehicle[] = [];
const tags: Tag[] = [];
const wallets: Wallet[] = [];
// ---- Rate Cards (base rates per vehicle class) -----------------------
const baseRates: Record<string, number> = {
  TWO_WHEELER: 0.200,
  CAR: 0.500,
  LCV: 0.800,
  BUS: 1.200,
  HCV: 1.800,
  MULTI_AXLE: 2.800,
  OVERSIZED: 4.000,
};

const rateCards: RateCard[] = [];
plazas.forEach((plz) => {
  vehicleClasses.forEach((vc, i) => {
    const base = baseRates[vc.code] ?? 0.500;
    rateCards.push({
      id: `rc-${plz.id}-${vc.code}`,
      tenantId: "tnt-1",
      plazaId: plz.id,
      vehicleClassCode: vc.code,
      direction: "BOTH",
      singleJourney: base,
      roundJourney: +(base * 1.6).toFixed(3),
      monthlyPass: +(base * 20).toFixed(3),
      effectiveFrom: iso(0),
      version: 1,
      status: "ACTIVE",
      createdBy: "Admin",
      createdAt: iso(0),
    });
  });
});
const rateRules: RateRule[] = [];
const discountPlans: DiscountPlan[] = [];
const transactions: Transaction[] = [];
const settlements: Settlement[] = [];
const violations: Violation[] = [];
const challans: Challan[] = [];
const staff: Staff[] = [
  { id: "stf-1", tenantId: "tnt-1", employeeId: "EMP-0001", name: "Admin User", designation: "PLAZA_MANAGER", status: "ACTIVE", hireDate: iso(0) },
  { id: "stf-2", tenantId: "tnt-1", employeeId: "EMP-0002", name: "Lane Operator", designation: "LANE_OPERATOR", status: "ACTIVE", hireDate: iso(0) },
];
const auditLogs: AuditLog[] = [];
const notifications: Notification[] = [];
const supportTickets: SupportTicket[] = [];
const corporateAccounts: CorporateAccount[] = [];
const invoices: Invoice[] = [];

export const initialState: AppState = {
  currentUser: null,
  currentTenantId: "tnt-1",
  activeModule: "dashboard",
  tenants,
  users,
  highways,
  plazas,
  lanes,
  devices,
  vehicleClasses,
  vehicles,
  tags,
  wallets,
  rateCards,
  rateRules,
  discountPlans,
  transactions,
  settlements,
  violations,
  challans,
  staff,
  auditLogs,
  notifications,
  supportTickets,
  corporateAccounts,
  invoices,
};
