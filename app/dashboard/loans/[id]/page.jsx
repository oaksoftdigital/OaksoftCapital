"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { db } from "@/lib/firebaseClient";
import { doc, onSnapshot } from "firebase/firestore";
import LoanDangerZoneBar from "@/features/loan/ui/LoanDangerZoneBar";

import { getLoanById } from "@/features/loan/services/coinrabbit";
import TokenChip from "@/features/loan/ui/TokenChip";



/**
 * Helpers (safe + UI-friendly)
 */
function fmtMs(ms) {
  if (typeof ms !== "number") return "-";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function fmtAmount(v, max = 6) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: max }).format(n);
}

function shortAddr(a) {
  if (!a) return "-";
  const s = String(a);
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function fmtDuration(openedMs, closedMs) {
  if (typeof openedMs !== "number" || typeof closedMs !== "number") return "-";
  const diff = closedMs - openedMs;
  if (!Number.isFinite(diff) || diff <= 0) return "-";

  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const EXPLORERS = {
  ETH: "https://etherscan.io",
  BASE: "https://basescan.org",
  ARBITRUM: "https://arbiscan.io",
  OPTIMISM: "https://optimistic.etherscan.io",
  POLYGON: "https://polygonscan.com",
  BSC: "https://bscscan.com",
  AVALANCHE: "https://snowtrace.io",
  LINEA: "https://lineascan.build",
  SCROLL: "https://scrollscan.com",
  GNOSIS: "https://gnosisscan.io",
};

function addrUrl(network, address) {
  const net = String(network || "").toUpperCase();
  const base = EXPLORERS[net];
  if (!base || !address) return null;
  return `${base}/address/${address}`;
}

export default function Page() {
  const params = useParams();
  const loanId = String(params?.id || "").trim();

  const [docData, setDocData] = useState(null);
  const [phase, setPhase] = useState(null);
  const [status, setStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const didRefreshZoneRef = useRef(false);

  const isActive = phase === "ACTIVE";

  useEffect(() => {
    if (!loanId) return;
    if (!isActive) return;
    if (didRefreshZoneRef.current) return;

    let cancelled = false;

    const run = async (tries = 0) => {
      try {
        await getLoanById(loanId);
        didRefreshZoneRef.current = true; 
      } catch (e) {
        const msg = String(e?.message || "");
        if (!cancelled && msg.includes("No logged in user") && tries < 8) {
          setTimeout(() => run(tries + 1), 350);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [loanId, isActive]);

  useEffect(() => {
    if (!loanId) {
      setLoading(false);
      setErr("Missing loanId");
      return;
    }

    setLoading(true);
    setErr("");

    const ref = doc(db, "loans", loanId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setErr("Loan not found");
          setDocData(null);
          setPhase(null);
          setStatus(null);
          setLoading(false);
          return;
        }

        const d = snap.data() || {};
        setDocData(d);

        const ph = d.phase || null;
        const st = d.status || d.coinrabbit?.status || null;

        setPhase(ph);
        setStatus(st);
        setLoading(false);
      },
      (e) => {
        console.error("LOAN DOC SNAPSHOT ERROR:", e);
        setErr(e?.message || "Snapshot error");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [loanId]);

  
  const isClosedLike =
    phase === "CLOSED" ||
    phase === "LIQUIDATED" ||
    String(status || "").toLowerCase().includes("closed") ||
    String(status || "").toLowerCase().includes("liquidat");

  /**
   * Build a CLOSED summary from your Firestore doc structure
   * (the exact shape you pasted).
   */
  const closedSummary = useMemo(() => {
    if (!docData) return null;

    const borrow = docData.borrow || {};
    const deposit = docData.deposit || {};
    const confirm = docData.confirm || {};
    const cr = docData.coinrabbit || {};
    const rp = docData.requestPayload || {};

    const ltvRaw = rp?.loan?.ltv_percent ?? null;
    const ltvPct =
      ltvRaw !== null && ltvRaw !== undefined && ltvRaw !== ""
        ? Number(ltvRaw) * 100
        : null;

    // Times: you have createdAt + updatedAt in ms. confirmedAt also exists.
    const openedAtMs = docData.createdAt ?? null;
    const closedAtMs = docData.updatedAt ?? null;
    const confirmedAtMs = confirm.confirmedAt ?? null;

    const collateralNetwork = deposit.currency_network || rp?.deposit?.currency_network || null;
    const borrowNetwork = borrow.currency_network || rp?.loan?.currency_network || null;

    const payoutAddress = confirm.payoutAddress || null;
    const depositAddress = cr.depositAddress || null;

    // Prefer BASE/borrow network for explorer links (payout on loan network)
    const payoutExplorer = addrUrl(borrowNetwork, payoutAddress);
    const depositExplorer = addrUrl(collateralNetwork, depositAddress);

    return {
      phase: docData.phase || "-",
      status: docData.status || cr.status || "-",

      openedAtMs,
      closedAtMs,
      confirmedAtMs,
      duration: fmtDuration(openedAtMs, closedAtMs),

      collateralAmount: deposit.expected_amount || rp?.deposit?.expected_amount || null,
      collateralCode: deposit.currency || rp?.deposit?.currency_code || null,
      collateralNetwork,

      borrowAmount: borrow.expected_amount || rp?.loan?.expected_amount || null,
      borrowCode: borrow.currency || rp?.loan?.currency_code || null,
      borrowNetwork,

      ltvPct,

      payoutAddress,
      payoutExplorer,

      depositAddress,
      depositExplorer,

      depositTxStatus: cr.depositTxStatus || null,
      lastSyncedAt: cr.lastSyncedAt ?? docData.coinrabbit?.lastSyncedAt ?? null,
    };
  }, [docData]);

  const btnStyle = (primary) => ({
    display: "inline-block",
    padding: "10px 18px",
    background: primary ? "var(--color-primary-500)" : "#eee",
    color: primary ? "#222" : "#444",
    borderRadius: 8,
    fontWeight: primary ? 600 : 500,
    fontSize: 16,
    textDecoration: "none",
  });

return (
    <div style={{ padding: 20, display: "grid", gap: 12, width: "100%", maxWidth: 1260, margin: "0 auto" }}>
      
      {/* ========================================== */}
      {/* 1. GLOBAL STATES                             */}
      {/* ========================================== */}
      {loading && (
        <div style={{ fontSize: 16, color: "#9BA2AE", marginBottom: 20 }}>
          Loading loan details...
        </div>
      )}
      
      {err && (
        <div style={{ fontSize: 16, color: "#ff4d4f", marginBottom: 20 }}>
          {err}
        </div>
      )}

      {/* ========================================== */}
      {/* 2. TOP ROW: BACK NAVIGATION                  */}
      {/* ========================================== */}
      <div style={{ width: "100%", marginBottom: 24 }}>
        <Link 
          href="/dashboard/loans" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 12, 
            textDecoration: "none",
            color: "#9BA2AE",
            fontFamily: '"Gramatika Trial", sans-serif',
            fontSize: "18px",
            fontWeight: 400,
            letterSpacing: "1.125px"
          }}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <img src="/assets/LeftAngle.svg" alt="Back" style={{ width: 14, height: 14 }} />
          </div>
          Back to Loan Dashboard
        </Link>
      </div>

      {/* ========================================== */}
      {/* 3. MAIN HEADER: ICON, TITLE, ID & BADGE      */}
      {/* ========================================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          
          {/* Collateral Icon */}
          <div style={{
            width: 72, 
            height: 72,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            {docData?.ui?.collateral?.logo && (
              <img 
                src={docData.ui.collateral.logo} 
                alt="Collateral" 
                style={{ width: 44, height: 44, borderRadius: "50%" }} 
              />
            )}
          </div>

          {/* Texts: Loan Pair + ID */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{
              color: "#FFF",
              fontFamily: '"Gramatika Trial", sans-serif',
              fontSize: "32px",
              fontWeight: 500,
              lineHeight: "70px", 
              letterSpacing: "0.988px",
              marginTop: "-12px"
            }}>
              Loan {docData?.ui?.collateral?.code || "..."}/{docData?.ui?.borrow?.code || "..."}
            </div>
            <div style={{
              color: "#9BA2AE",
              fontFamily: '"Gramatika Trial", sans-serif',
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: "24px",
              letterSpacing: "1.125px",
              marginTop: "-12px"
            }}>
              ID {loanId || "-"}
            </div>
          </div>
        </div>

        {/* ACTIVE Status Badge */}
        {isActive && (
          <div style={{
            display: "inline-flex",
            padding: "6px 10px 5px 10px",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            borderRadius: "6px",
            background: "rgba(149, 225, 0, 0.30)",
            color: "#95E100", 
            fontWeight: 600,
            fontSize: "14px",
            marginTop: "16px"
          }}>
            ACTIVE
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 4. RESPONSIVE STYLES                         */}
      {/* ========================================== */}
      <style>{`
        @media (max-width: 768px) {
          .main-layout-grid { grid-template-columns: 1fr !important; }
          .metrics-grid { grid-template-columns: 1fr !important; }
          .buttons-grid { grid-template-columns: 1fr !important; }
          .details-row { flex-direction: column !important; gap: 24px !important; }
          .details-col { width: 100% !important; }
        }
      `}</style>

      {/* ========================================== */}
      {/* 5. ACTIVE LOAN DASHBOARD                     */}
      {/* ========================================== */}
      {!loading && !err && isActive && (
        <div 
          className="main-layout-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "24px",
            width: "100%",
            marginBottom: "32px"
          }}
        >
          {/* --- LEFT COLUMN --- */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Top Cards Grid */}
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              
              <div style={{
                display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px",
                padding: "20px", borderRadius: "12.917px",
                border: "2.348px solid rgba(255, 255, 255, 0.10)",
                background: "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
                boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
                backdropFilter: "blur(20.138px)",
              }}>
                <span style={{ color: "#9CA3AF", fontSize: "17px", fontWeight: 400 }}>Deposit</span>
                <span style={{ color: "#FFF", fontSize: "24px", fontWeight: 500 }}>
                  {fmtAmount(docData?.deposit?.amount || docData?.deposit?.expected_amount || docData?.requestPayload?.deposit?.expected_amount || 0, 3)} {docData?.ui?.collateral?.code || ""}
                </span>
              </div>

              <div style={{
                display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px",
                padding: "20px", borderRadius: "12.917px",
                border: "2.348px solid rgba(255, 255, 255, 0.10)",
                background: "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
                boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
                backdropFilter: "blur(20.138px)",
              }}>
                <span style={{ color: "#9CA3AF", fontSize: "17px", fontWeight: 400 }}>Loan</span>
                <span style={{ color: "#FFF", fontSize: "24px", fontWeight: 500 }}>
                  {fmtAmount(docData?.borrow?.amount || docData?.borrow?.expected_amount || docData?.requestPayload?.loan?.expected_amount || 0, 2)} {docData?.ui?.borrow?.code || ""}
                </span>
              </div>

              <div style={{
                display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px",
                padding: "20px", borderRadius: "12.917px",
                border: "2.348px solid rgba(255, 255, 255, 0.10)",
                background: "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
                boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
                backdropFilter: "blur(20.138px)",
              }}>
                <span style={{ color: "#9CA3AF", fontSize: "17px", fontWeight: 400 }}>Full Repayment</span>
                <span style={{ color: "#FFF", fontSize: "24px", fontWeight: 500 }}>
                  {fmtAmount(docData?.fullRepayment || 0, 2)} {docData?.ui?.borrow?.code || ""}
                </span>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="buttons-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
              <Link 
                href={`/dashboard/loans/${encodeURIComponent(loanId)}/increase`}
                style={{
                  display: "flex", height: "64px", justifyContent: "center", alignItems: "center", gap: "12px",
                  borderRadius: "8px", background: "#005FFF", color: "#FFF", textDecoration: "none", fontWeight: 600, fontSize: "16px"
                }}
              >
                <img src="/assets/TrendUp.svg" alt="Increase" style={{ width: 20, height: 20 }} /> Increase
              </Link>
              
              <Link 
                href={`/dashboard/loans/${encodeURIComponent(loanId)}/pledge`}
                style={{
                  display: "flex", height: "64px", justifyContent: "center", alignItems: "center", gap: "12px",
                  borderRadius: "8px", background: "#95E100", color: "#000", textDecoration: "none", fontWeight: 600, fontSize: "16px"
                }}
              >
                <img src="/assets/ClockClockwise.svg" alt="Repay" style={{ width: 20, height: 20 }} /> Repay
              </Link>
            </div>

            {/* Loan Details Card */}
            <div 
              className="flex flex-col gap-5 w-full p-[25px] rounded-[12.917px] border-[2.348px] border-white/10 backdrop-blur-[20.14px]"
              style={{
                background: "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
                boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)"
              }}
            >
              <h2 className="text-white text-2xl font-medium text-left m-0">
                Loan Details
              </h2>
              
              <div className="details-row flex w-full">
                <div className="details-col w-1/2 flex flex-col gap-4 text-left">
                  <div>
                    <p className="text-[#9BA2AE] text-lg font-normal mb-1">Loan ID</p>
                    <p className="text-white text-[22px] font-normal m-0">{docData?.loanId || loanId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[#9BA2AE] text-lg font-normal mb-1">APR</p>
                    <p className="text-white text-[22px] font-normal m-0">{docData?.interestPercent ? `${docData.interestPercent}%` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[#9BA2AE] text-lg font-normal mb-1">Duration</p>
                    <p className="text-white text-[22px] font-normal m-0">{docData?.requestPayload?.lifetime === 1 ? "30 Days" : "Unlimited"}</p>
                  </div>
                </div>

                <div className="details-col w-1/2 flex flex-col gap-4 text-left">
                  <div>
                    <p className="text-[#9BA2AE] text-lg font-normal mb-1">Current rate</p>
                    <p className="text-white text-[22px] font-normal m-0">
                      {docData?.currentRate && docData?.ui ? `${fmtAmount(docData.currentRate, 2)} ${docData.ui.collateral?.code}/${docData.ui.borrow?.code}` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9BA2AE] text-lg font-normal mb-1">Monthly Interest</p>
                    <p className="text-white text-[22px] font-normal m-0">{docData?.monthlyInterest ? `${fmtAmount(docData.monthlyInterest, 2)}%` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[#9BA2AE] text-lg font-normal mb-1">LTV</p>
                    <p className="text-white text-[22px] font-normal m-0">
                      {docData?.requestPayload?.ltv_percent ? `${(Number(docData.requestPayload.ltv_percent) * 100).toFixed(0)}%` : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div 
            className="flex flex-col gap-8 w-full p-[25px] rounded-[12.917px] border-[2.348px] border-white/10 backdrop-blur-[20.14px]"
            style={{
              background: "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
              boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)"
            }}
          >
            <div className="w-full flex justify-center">
              <LoanDangerZoneBar zone={docData?.coinrabbit?.currentZone} />
            </div>

            <div className="flex flex-col gap-4 w-full p-5 rounded-[12px] border-[1.174px] border-[#1F242F] bg-[#161B26]">
              <div className="flex flex-col text-left">
                <p className="text-[#9BA2AE] text-lg font-normal mb-1">Current Rate</p>
                <p className="text-white text-[22px] font-normal m-0">
                  {docData?.currentRate && docData?.ui ? `${fmtAmount(docData.currentRate, 2)} ${docData.ui.collateral?.code}/${docData.ui.borrow?.code}` : "-"}
                </p>
              </div>

              <div className="w-full border-t border-[#374151]"></div>

              <div className="flex flex-col text-left">
                <p className="text-[#9BA2AE] text-lg font-normal mb-1">Margin Call</p>
                <p className="text-white text-[22px] font-normal m-0">
                  {docData?.liquidationPrice && docData?.ui ? `${fmtAmount(docData.liquidationPrice, 2)} ${docData.ui.collateral?.code}/${docData.ui.borrow?.code}` : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 6. CLOSED / LIQUIDATED STATE                 */}
      {/* ========================================== */}
      {!loading && !err && !isActive && isClosedLike && closedSummary && (
        <div style={{
          border: "1px solid #222", borderRadius: 12, padding: 16, background: "#23272f",
          display: "grid", gap: 14, color: "#f3f3f3", boxShadow: "0 2px 12px 0 rgba(0,0,0,0.10)",
        }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>Final summary</div>

          <div style={{ fontSize: 14, lineHeight: 1.5, color: "#e0e0e0" }}>
            <b style={{ color: "#fff" }}>Opened:</b> {fmtMs(closedSummary.openedAtMs)} <br />
            <b style={{ color: "#fff" }}>Closed:</b> {fmtMs(closedSummary.closedAtMs)}{" "}
            <span style={{ color: "#b0b0b0" }}>{closedSummary.duration !== "-" ? `(${closedSummary.duration})` : ""}</span><br />
            <b style={{ color: "#fff" }}>Confirmed:</b> {fmtMs(closedSummary.confirmedAtMs)}
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.5, color: "#e0e0e0" }}>
            <b style={{ color: "#fff" }}>Collateral:</b> {fmtAmount(closedSummary.collateralAmount)} {closedSummary.collateralCode || "-"}{" "}
            <span style={{ color: "#b0b0b0" }}>({closedSummary.collateralNetwork || "-"})</span><br />
            <b style={{ color: "#fff" }}>Borrow:</b> {fmtAmount(closedSummary.borrowAmount)} {closedSummary.borrowCode || "-"}{" "}
            <span style={{ color: "#b0b0b0" }}>({closedSummary.borrowNetwork || "-"})</span><br />
            <b style={{ color: "#fff" }}>LTV:</b> {Number.isFinite(closedSummary.ltvPct) ? `${fmtAmount(closedSummary.ltvPct, 2)}%` : "-"}
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.5, color: "#e0e0e0" }}>
            <b style={{ color: "#fff" }}>Payout address:</b>{" "}
            {closedSummary.payoutAddress ? (
              closedSummary.payoutExplorer 
                ? <a href={closedSummary.payoutExplorer} target="_blank" rel="noreferrer" style={{ color: "#7ec4fa", textDecoration: "underline" }}>{shortAddr(closedSummary.payoutAddress)}</a>
                : shortAddr(closedSummary.payoutAddress)
            ) : "-"}<br />
            <b style={{ color: "#fff" }}>Deposit address:</b>{" "}
            {closedSummary.depositAddress ? (
              closedSummary.depositExplorer 
                ? <a href={closedSummary.depositExplorer} target="_blank" rel="noreferrer" style={{ color: "#7ec4fa", textDecoration: "underline" }}>{shortAddr(closedSummary.depositAddress)}</a>
                : shortAddr(closedSummary.depositAddress)
            ) : "-"}
          </div>

          <div style={{ fontSize: 13, color: "#b0b0b0", lineHeight: 1.4 }}>
            <b style={{ color: "#fff" }}>Deposit tx status:</b> {closedSummary.depositTxStatus || "-"}<br />
            <b style={{ color: "#fff" }}>Last synced:</b> {fmtMs(closedSummary.lastSyncedAt)}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 7. PENDING STATE                             */}
      {/* ========================================== */}
      {!loading && !err && !isActive && !isClosedLike && (
        <div style={{ fontSize: 12, color: "#666" }}>
          This loan is not active yet. Please wait for deposit confirmation.
        </div>
      )}

    </div>
  );
}
