"use client";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/app-store";
import { OmanPlateInput, OMAN_REGIONS } from "@/components/common/oman-plate-input";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Vehicle, VehicleClassCode, PaymentMethod, Transaction } from "@/lib/types";
import {
  Car, Truck, Bus, Bike, MapPin, Calculator, Wallet, CreditCard,
  Banknote, Smartphone, CheckCircle2, ArrowRight, RotateCcw,
  Printer, AlertCircle, User, X, Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const VEHICLE_CLASS_ICONS: Record<VehicleClassCode, typeof Car> = {
  CAR: Car,
  LCV: Truck,
  HCV: Truck,
  BUS: Bus,
  MULTI_AXLE: Truck,
  OVERSIZED: Truck,
  TWO_WHEELER: Bike,
};

const STEPS = [
  { num: 1, label: "Vehicle & Plate", icon: Car },
  { num: 2, label: "Trip Details", icon: MapPin },
  { num: 3, label: "Toll & Payment", icon: Calculator },
];

export function OperatorConsole() {
  const plazas = useStore((s) => s.plazas);
  const lanes = useStore((s) => s.lanes);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const rateCards = useStore((s) => s.rateCards);
  const vehicles = useStore((s) => s.vehicles);
  const wallets = useStore((s) => s.wallets);
  const tags = useStore((s) => s.tags);
  const transactions = useStore((s) => s.transactions);
  const addTransaction = useStore((s) => s.addTransaction);
  const currentUser = useStore((s) => s.currentUser)!;
  const pushAudit = useStore((s) => s.pushAudit);

  // Form state
  const [vehicleClass, setVehicleClass] = useState<VehicleClassCode | "">("");
  const [plate, setPlate] = useState("");
  const [plazaId, setPlazaId] = useState(plazas[0]?.id ?? "");
  const [laneId, setLaneId] = useState("");
  const [direction, setDirection] = useState<"FORWARD" | "REVERSE">("FORWARD");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WALLET");
  const [submittedTxn, setSubmittedTxn] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Lookup matched vehicle by plate
  const matchedVehicle: Vehicle | undefined = useMemo(
    () => vehicles.find((v) => v.plateNumber === plate),
    [plate, vehicles]
  );

  const matchedTag = matchedVehicle
    ? tags.find((t) => t.vehicleId === matchedVehicle.id && t.status === "ACTIVE")
    : undefined;
  const matchedWallet = matchedTag
    ? wallets.find((w) => w.tagId === matchedTag.id)
    : undefined;

  // Auto-select vehicle class if matched vehicle has one
  useEffect(() => {
    if (matchedVehicle && !vehicleClass) {
      setVehicleClass(matchedVehicle.vehicleClassCode);
    }
  }, [matchedVehicle]);

  // Rate lookup
  const rateCard = useMemo(() => {
    if (!plazaId || !vehicleClass) return null;
    return rateCards.find(
      (rc) => rc.plazaId === plazaId && rc.vehicleClassCode === vehicleClass && rc.status === "ACTIVE"
    );
  }, [plazaId, vehicleClass, rateCards]);

  const baseAmount = rateCard?.singleJourney ?? 0;
  const taxAmount = +(baseAmount * 0.05).toFixed(3);
  const totalAmount = +(baseAmount + taxAmount).toFixed(3);

  // Wallet sufficiency
  const walletSufficient = paymentMethod !== "WALLET" || (matchedWallet?.balance ?? 0) >= totalAmount;

  // Auto-select payment method based on vehicle
  useEffect(() => {
    if (matchedWallet && matchedWallet.balance >= totalAmount) {
      setPaymentMethod("WALLET");
    } else {
      setPaymentMethod("CARD");
    }
  }, [matchedWallet, totalAmount]);

  // Validation
  const step1Valid = plate.match(/^\d{1,6}-[A-Z]+$/) && vehicleClass !== "";
  const step2Valid = plazaId !== "" && laneId !== "";
  const step3Valid = rateCard !== null && totalAmount > 0;
  const paymentValid = walletSufficient;
  const allValid = step1Valid && step2Valid && step3Valid && paymentValid;

  const plazaLanes = lanes.filter((l) => l.plazaId === plazaId);

  const handleSubmit = () => {
    if (!allValid) {
      toast.error("Please complete all steps before submitting");
      return;
    }
    const txnId = `txn-${String(transactions.length + 1).padStart(5, "0")}`;
    const txn: Transaction = {
      id: txnId,
      tenantId: "tnt-1",
      plazaId,
      laneId,
      vehicleId: matchedVehicle?.id,
      tagId: matchedTag?.id,
      walletId: matchedWallet?.id,
      vehicleClassCode: vehicleClass as VehicleClassCode,
      plateCaptured: plate,
      amount: baseAmount,
      taxAmount,
      totalAmount,
      paymentMethod,
      status: "SUCCESS",
      idempotencyKey: `idk-${plazas.find(p => p.id === plazaId)?.code}-${laneId}-${Date.now()}`,
      capturedAt: new Date().toISOString(),
    };
    addTransaction(txn);
    pushAudit({
      tenantId: "tnt-1",
      actorName: currentUser.name,
      action: "CREATE",
      module: "transactions",
      entityType: "transaction",
      entityId: txnId,
      afterValue: JSON.stringify({ plate, amount: totalAmount, method: paymentMethod }),
      ipAddress: "10.0.1.42",
    });
    setSubmittedTxn(txn);
    setShowReceipt(true);
    toast.success("Transaction captured", {
      description: `${plate} · ${formatCurrency(totalAmount, "OMR")} · ${paymentMethod}`,
    });
  };

  const handleReset = () => {
    setVehicleClass("");
    setPlate("");
    setLaneId("");
    setDirection("FORWARD");
    setPaymentMethod("WALLET");
    setSubmittedTxn(null);
    setShowReceipt(false);
  };

  const plaza = plazas.find(p => p.id === submittedTxn?.plazaId)?.name ?? "";
  const laneNum = lanes.find(l => l.id === submittedTxn?.laneId)?.number ?? 0;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-navy">Operator Console</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Lane transaction entry — {currentUser.name}
              </p>
            </div>
            <Badge variant="outline" className="border-teal text-teal bg-teal/5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Lane Open
            </Badge>
          </div>

          {/* Step progress indicator */}
          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3 mt-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const valid = [step1Valid, step2Valid, step3Valid][i];
              return (
                <div key={step.num} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full grid place-items-center text-xs font-bold transition-all",
                        valid
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground border border-border"
                      )}
                    >
                      {valid ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Step {step.num}</div>
                      <div className="text-xs font-medium text-foreground">{step.label}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-2 sm:mx-3 transition-colors", valid ? "bg-emerald-400" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ---- STEP 1: VEHICLE & PLATE ---- */}
          <Card className="p-5 border-l-4 border-l-teal">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-teal/10 grid place-items-center">
                <Car className="h-4 w-4 text-teal" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-navy">Step 1 · Vehicle & Plate</h2>
                <p className="text-[0.65rem] text-muted-foreground">Select class, enter Oman plate (auto-dash)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Vehicle Class</Label>
                <Select value={vehicleClass} onValueChange={(v) => setVehicleClass(v as VehicleClassCode)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select vehicle class" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleClasses.map((vc) => {
                      const Icon = VEHICLE_CLASS_ICONS[vc.code];
                      return (
                        <SelectItem key={vc.code} value={vc.code}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{vc.label}</span>
                            <Badge variant="outline" className="text-[0.55rem] ml-auto">{vc.axleCount} axle</Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Plate Number (Oman)</Label>
                <OmanPlateInput value={plate} onChange={setPlate} autoFocus />
              </div>

              {matchedVehicle && (
                <div className="p-3 rounded-md bg-teal/5 border border-teal/20">
                  <div className="flex items-center gap-2 text-xs text-teal font-medium mb-1">
                    <User className="h-3.5 w-3.5" />
                    Registered Vehicle Found
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[0.6rem] text-muted-foreground uppercase">Owner</div>
                      <div className="font-medium">{matchedVehicle.ownerName}</div>
                    </div>
                    <div>
                      <div className="text-[0.6rem] text-muted-foreground uppercase">Wallet Balance</div>
                      <div className={cn("font-mono font-bold", matchedWallet && matchedWallet.balance < 5 ? "text-amber-600" : "text-emerald-600")}>
                        {matchedWallet ? formatCurrency(matchedWallet.balance, "OMR") : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {plate && !matchedVehicle && plate.match(/^\d{1,6}-[A-Z]+$/) && (
                <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <strong>Unregistered plate.</strong> Cash or card payment only. ANPR image captured.
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ---- STEP 2: TRIP DETAILS ---- */}
          <Card className="p-5 border-l-4 border-l-[var(--color-slate-blue)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-[var(--color-slate-blue)]/10 grid place-items-center">
                <MapPin className="h-4 w-4" style={{ color: "var(--color-slate-blue)" }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-navy">Step 2 · Trip Details</h2>
                <p className="text-[0.65rem] text-muted-foreground">Plaza, lane, and direction</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Toll Plaza</Label>
                <Select value={plazaId} onValueChange={(v) => { setPlazaId(v); setLaneId(""); }}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select plaza" />
                  </SelectTrigger>
                  <SelectContent>
                    {plazas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[0.65rem] text-muted-foreground">{p.code}</span>
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Lane</Label>
                <Select value={laneId} onValueChange={setLaneId} disabled={!plazaId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select lane" />
                  </SelectTrigger>
                  <SelectContent>
                    {plazaLanes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        <div className="flex items-center gap-2">
                          <span>L{l.number}</span>
                          <Badge variant="outline" className="text-[0.55rem]">{l.type.replace("_", "/")}</Badge>
                          <span className="text-[0.6rem] text-muted-foreground">{l.direction}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Direction</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["FORWARD", "REVERSE"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDirection(d)}
                      className={cn(
                        "h-10 rounded-md border-2 text-xs font-semibold transition-all",
                        direction === d
                          ? "border-teal bg-teal/10 text-teal"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/30"
                      )}
                    >
                      {d === "FORWARD" ? "→ Forward" : "← Reverse"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ---- STEP 3: TOLL CALCULATION + PAYMENT (combined) ---- */}
          <Card className="p-5 lg:col-span-2 border-l-4 border-l-[var(--color-gold)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-[var(--color-gold)]/10 grid place-items-center">
                <Calculator className="h-4 w-4" style={{ color: "var(--color-gold-dark)" }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-navy">Step 3 · Toll Calculation & Payment</h2>
                <p className="text-[0.65rem] text-muted-foreground">Auto-calculated rate + select payment method</p>
              </div>
            </div>

            {rateCard ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Rate calculation */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-md bg-muted/40">
                      <div className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">Vehicle Class</div>
                      <div className="font-medium text-sm mt-0.5">{vehicleClasses.find(vc => vc.code === vehicleClass)?.label}</div>
                    </div>
                    <div className="p-2.5 rounded-md bg-muted/40">
                      <div className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">Rate Card</div>
                      <div className="font-medium text-sm mt-0.5">v{rateCard.version}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border border-border bg-card">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base toll</span>
                        <span className="font-mono font-medium">{formatCurrency(baseAmount, "OMR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VAT (5%)</span>
                        <span className="font-mono font-medium">{formatCurrency(taxAmount, "OMR")}</span>
                      </div>
                      <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between items-center">
                        <span className="font-semibold text-foreground">Total Due</span>
                        <span className="font-mono font-bold text-lg text-[var(--color-gold-dark)]">{formatCurrency(totalAmount, "OMR")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[0.65rem] text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Rate effective from {new Date(rateCard.effectiveFrom).toLocaleDateString("en-OM")}
                  </div>
                </div>

                {/* Right: Payment method */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { method: "CASH" as const, label: "Cash", icon: Banknote, available: true },
                      { method: "WALLET" as const, label: "Wallet / RFID", icon: Wallet, available: !!matchedWallet && (matchedWallet?.balance ?? 0) >= totalAmount },
                      { method: "CARD" as const, label: "Card / POS", icon: CreditCard, available: true },
                      { method: "UPI" as const, label: "UPI / Bank", icon: Smartphone, available: true },
                    ]).map(({ method, label, icon: Icon, available }) => (
                      <button
                        key={method}
                        onClick={() => available && setPaymentMethod(method)}
                        disabled={!available}
                        className={cn(
                          "h-12 rounded-md border-2 flex items-center justify-center gap-2 transition-all text-xs font-semibold",
                          paymentMethod === method
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : available
                              ? "border-border bg-background text-muted-foreground hover:border-emerald-300"
                              : "border-border bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "WALLET" && matchedWallet && (
                    <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Current Balance</span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(matchedWallet.balance, "OMR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">After Deduction</span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(matchedWallet.balance - totalAmount, "OMR")}</span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "CASH" && (
                    <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Collect {formatCurrency(totalAmount, "OMR")} in cash from customer
                    </div>
                  )}

                  {paymentMethod === "CARD" && (
                    <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tap or insert card on POS terminal
                    </div>
                  )}

                  {paymentMethod === "UPI" && (
                    <div className="p-3 rounded-md bg-purple-50 border border-purple-200 text-xs text-purple-700 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Scan QR code to pay {formatCurrency(totalAmount, "OMR")}
                    </div>
                  )}

                  {paymentMethod === "WALLET" && matchedWallet && matchedWallet.balance < totalAmount && (
                    <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Insufficient balance — select Card or UPI
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Complete Step 1 &amp; 2 to calculate toll
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-border">
              <Button variant="outline" onClick={handleReset} className="text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear Form
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!allValid}
                className="h-11 px-8 text-sm font-semibold"
                style={{
                  background: allValid ? "linear-gradient(135deg, #2E8B8B 0%, #1F6868 100%)" : "var(--muted)",
                  color: allValid ? "white" : "var(--muted-foreground)",
                }}
              >
                Capture Transaction
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {!allValid && (
              <div className="mt-3 text-[0.65rem] text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                Complete all fields above to enable capture
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ---- RECEIPT MODAL ---- */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="p-6">
            {/* Success header */}
            <div className="text-center mb-5">
              <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 grid place-items-center mb-3">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-navy">Transaction Captured</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Saved to admin dashboard</p>
            </div>

            {/* Receipt card */}
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="text-center pb-3 border-b border-dashed border-border">
                <div className="text-sm font-bold text-navy tracking-wider">GLOBAL TOLL</div>
                <div className="text-[0.6rem] text-muted-foreground mt-0.5">Oman Toll Operations LLC</div>
              </div>

              <div className="py-3 space-y-1.5 text-xs">
                <ReceiptRow label="Receipt No" value={submittedTxn?.id.toUpperCase() ?? ""} mono />
                <ReceiptRow label="Date / Time" value={submittedTxn ? formatDateTime(submittedTxn.capturedAt) : ""} />
                <ReceiptRow label="Plaza" value={plaza} />
                <ReceiptRow label="Lane" value={`L${laneNum}`} mono />
                <ReceiptRow label="Operator" value={currentUser.name} />
                <ReceiptRow label="Plate" value={submittedTxn?.plateCaptured ?? ""} mono accent />
                <ReceiptRow label="Class" value={submittedTxn?.vehicleClassCode ?? ""} />
                <ReceiptRow label="Payment" value={submittedTxn?.paymentMethod ?? ""} />
              </div>

              <div className="py-3 border-t border-dashed border-border space-y-1 text-xs">
                <ReceiptRow label="Base Toll" value={submittedTxn ? formatCurrency(submittedTxn.amount, "OMR") : ""} mono />
                <ReceiptRow label="VAT (5%)" value={submittedTxn ? formatCurrency(submittedTxn.taxAmount, "OMR") : ""} mono />
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-border">
                  <span className="font-bold text-navy">TOTAL PAID</span>
                  <span className="font-mono font-bold text-lg text-[var(--color-gold-dark)]">
                    {submittedTxn ? formatCurrency(submittedTxn.totalAmount, "OMR") : ""}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-border text-center text-[0.6rem] text-muted-foreground">
                Thank you for using Global Toll
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button
                className="flex-1"
                onClick={handleReset}
                style={{ background: "linear-gradient(135deg, #2E8B8B 0%, #1F6868 100%)" }}
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Next Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- PREVIOUS CUSTOMERS - Glassmorphism Panel ---- */}
      {transactions.length > 0 && (
        <div className="fixed bottom-4 left-4 z-40 w-80 max-h-72 overflow-hidden">
          <div
            className="rounded-2xl border border-white/20 p-4 overflow-y-auto max-h-72 scrollbar-thin"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            }}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/20">
              <Receipt className="h-4 w-4 text-teal" />
              <span className="text-xs font-semibold text-navy">Previous Customers</span>
              <Badge variant="outline" className="ml-auto text-[0.55rem] h-5 bg-teal/10 border-teal/30 text-teal">
                {transactions.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {transactions.slice(-5).reverse().map((txn) => {
                const txnPlaza = plazas.find((p) => p.id === txn.plazaId);
                return (
                  <div
                    key={txn.id}
                    className="p-2.5 rounded-xl border border-white/20 text-xs"
                    style={{ background: "rgba(255, 255, 255, 0.25)" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-navy">{txn.plateCaptured}</span>
                      <span className="font-mono font-bold text-[var(--color-gold-dark)]">{formatCurrency(txn.totalAmount, "OMR")}</span>
                    </div>
                    <div className="flex items-center justify-between text-[0.6rem] text-muted-foreground">
                      <span>{txnPlaza?.name}</span>
                      <span>{formatDateTime(txn.capturedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-[0.5rem] h-4 bg-emerald-50 border-emerald-200 text-emerald-700">
                        {txn.paymentMethod}
                      </Badge>
                      <span className="text-[0.55rem] text-muted-foreground">{txn.vehicleClassCode}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptRow({
  label, value, mono, accent,
}: {
  label: string; value: string; mono?: boolean; accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", mono && "font-mono", accent && "text-[var(--color-gold-dark)] font-bold")}>{value}</span>
    </div>
  );
}
