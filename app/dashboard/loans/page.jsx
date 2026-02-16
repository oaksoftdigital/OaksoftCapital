"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import LoanZonePill from "@/features/loan/ui/LoanZonePill";
import useRefreshLoanZones from "@/features/loan/hooks/useRefreshLoanZones";
import { usePathname } from "next/navigation";
import TokenChip from "@/features/loan/ui/TokenChip";
import ClaimDashboardBanner from "@/features/loan/ui/ClaimDashboardBanner";



export default function Page() {
  const router = useRouter();

  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyErr, setHistoryErr] = useState("");

  const [snapErr, setSnapErr] = useState("");
  const pathname = usePathname();

  // Refresh loan zones
  useRefreshLoanZones({
    loans,
    enabled: !!uid,
    limit: 10,
    onlyIfMissing: true,
    entryKey: pathname,
  });

  // 1) Detect user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid || null);
    });
    return () => unsub();
  }, []);

  // 2) Subscribe to ACTIVE loans
  useEffect(() => {
    if (!uid) {
      setLoans([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "loans"),
      where("uid", "==", uid),
      where("phase", "==", "ACTIVE"),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          console.log("SNAP ACTIVE", {
            docId: d.id,
            loanId: data.loanId,
            zone: data?.coinrabbit?.currentZone,
            updatedAt: data?.updatedAt,
          });
          return { id: d.id, ...data };
        });

        setLoans(items);
        setSnapErr("");
        setLoading(false);
      },
      (err) => {
        console.error("LOANS SNAPSHOT ERROR:", err);
        setSnapErr(err?.message || "Snapshot error");
        setLoading(false);
      }
      
    );

    return () => unsub();
  }, [uid]);

  // 3) Subscribe to CLOSED/LIQUIDATED loans (history)
  useEffect(() => {
    if (!uid) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);

    const qh = query(
      collection(db, "loans"),
      where("uid", "==", uid),
      where("phase", "in", ["CLOSED", "LIQUIDATED"]),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(
      qh,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setHistory(items);
        setHistoryErr("");
        setLoadingHistory(false);
      },
      (err) => {
        console.error("HISTORY SNAPSHOT ERROR:", err);
        setHistoryErr(err?.message || "Snapshot error");
        setLoadingHistory(false);
      }
    );

    return () => unsub();
  }, [uid]);


  return (
    // Main container wrap
    <div style={{ padding: 20, display: "grid", gap: 16, width: "100%", maxWidth: 1260, margin: "0 auto" }}>

      <ClaimDashboardBanner />
      
      {/* Header section */}
      <div style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0",
        gap: 12,
        marginBottom: 16
      }}>
        
        {/* Left column: Title and Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, color: "#fff" }}>Loan Dashboard</h1>
          <p style={{
            margin: 0,
            color: "#9BA2AE",
            fontFamily: '"Gramatika Trial", sans-serif',
            fontSize: "16px",
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: "24px",
            letterSpacing: "1.125px",
          }}>
            Manage your Active Loans and Collaterals
          </p>
        </div>

        {/* Right column: Button navigating to /loans */}
        <button 
          onClick={() => router.push('/loans')}
          style={{
            display: "flex",
            width: "234px",
            padding: "20px 30px",
            flexDirection: "row", 
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            borderRadius: "8px",
            background: "#95E100",
            border: "none",
            color: "#000",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <img src="/assets/Calculator2.svg" alt="Calculator icon" style={{ width: 24, height: 24 }} />
          <span>Loan Calculator</span>
        </button>
      </div>

      {!uid && <div style={{ fontSize: 14, color: "#666" }}>Please log in.</div>}

      {uid && loading && <div style={{ fontSize: 14, color: "#666" }}>Loading...</div>}

      {snapErr && <div style={{ color: "red", fontSize: 12 }}>{snapErr}</div>}

      {uid && !loading && loans.length === 0 && (
        <div style={{ fontSize: 14, color: "#666" }}>No active loans yet.</div>
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .responsive-card {
            flex-direction: column !important;
            height: auto !important;
            padding: 20px !important;
            gap: 20px !important;
          }
          .responsive-col {
            width: 100% !important;
            padding: 0 !important;
            flex-wrap: wrap !important;
            gap: 16px !important;
          }
          .resp-text-xl { font-size: 20px !important; }
          .resp-text-lg { font-size: 18px !important; }
          .resp-text-sm { font-size: 14px !important; }
          .resp-icon-box { width: 48px !important; height: 48px !important; }
          .resp-icon-img { width: 28px !important; height: 28px !important; }
        }
      `}</style>

      {loans.map((l) => {
        // Fix: Check multiple paths for the amount depending on how it was saved in Firebase
        const rawAmount = l.deposit?.amount || l.deposit?.expected_amount || l.requestPayload?.deposit?.expected_amount || 0;
        const amount = Number(rawAmount).toFixed(3);
        
        const currentRateVal = l.currentRate ? Number(l.currentRate).toFixed(2) : "0.00";
        const marginCallVal = l.liquidationPrice ? Number(l.liquidationPrice).toFixed(2) : "0.00";
        const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "-";

        return (
          <div
            key={l.id}
            className="responsive-card"
            style={{
              width: "100%",
              height: "112px",
              borderRadius: "12.917px",
              border: "2.348px solid rgba(255, 255, 255, 0.10)",
              background: "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
              boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
              backdropFilter: "blur(20.138px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 33px 24px 25px",
              gap: 12,
            }}
          >
            {/* Left Column (50% on desktop, 100% on mobile) */}
            <div className="responsive-col" style={{ display: "flex", width: "50%", justifyContent: "space-between", alignItems: "center", paddingRight: "20px" }}>
              
              {/* Left Side: Icon Column + Text Column */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                
                {/* Icon inside a round background */}
                <div className="resp-icon-box" style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <img 
                    src={l.ui?.collateral?.logo} 
                    alt="logo" 
                    className="resp-icon-img"
                    style={{ width: 40, height: 40, borderRadius: "50%" }} 
                  />
                </div>

                {/* Amount and Date stacked vertically */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                  <span className="resp-text-xl" style={{ color: "#fff", fontSize: "26px", fontWeight: 500, lineHeight: 1 }}>
                    {amount} {l.ui?.collateral?.network}
                  </span>
                  <span className="resp-text-sm" style={{ color: "#9BA2AE", fontSize: "18px", fontWeight: 400 }}>
                    {dateStr}
                  </span>
                </div>
              </div>

              {/* Right Side: Current Rate */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                <span className="resp-text-sm" style={{ color: "#9BA2AE", fontSize: "18px", fontWeight: 400 }}>Current Rate</span>
                <span className="resp-text-lg" style={{ color: "#fff", fontSize: "22px" }}>${currentRateVal}</span>
              </div>
            </div>

            {/* Right Column (50% on desktop, 100% on mobile) */}
            <div className="responsive-col" style={{ display: "flex", width: "50%", justifyContent: "space-between", alignItems: "center", paddingLeft: "20px" }}>
              
              {/* Left: Margin Call */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                <span className="resp-text-sm" style={{ color: "#9BA2AE", fontSize: "18px", fontWeight: 400 }}>Margin Call</span>
                <span className="resp-text-lg" style={{ color: "#fff", fontSize: "22px" }}>${marginCallVal}</span>
              </div>

              {/* Center: Loan Health Status */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                <span className="resp-text-sm" style={{ color: "#9BA2AE", fontSize: "18px", fontWeight: 400 }}>Loan Health Status</span>
                <LoanZonePill zone={l.coinrabbit?.currentZone} showWhenUnknown />
              </div>

              {/* Right: Round Open Button */}
              <button
                onClick={() => router.push(`/dashboard/loans/${encodeURIComponent(l.loanId || l.id)}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#4a515c")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#323841")}
                style={{
                  display: "flex",
                  width: "38px",
                  height: "38px",
                  padding: "11.742px 0",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "83px",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  background: "#323841",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  flexShrink: 0
                }}
              >
                <img src="/assets/RightAngle.svg" alt="Open loan" style={{ width: 14, height: 14 }} />
              </button>

            </div>
          </div>
        );
      })}
      {/* <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />

      <h3 style={{ fontWeight: 600, fontSize: 18, margin: 0 }}>History</h3> */}

      {loadingHistory && <div style={{ fontSize: 14, color: "#666" }}>Loading history...</div>}
      {historyErr && <div style={{ color: "red", fontSize: 12 }}>{historyErr}</div>}

      {!loadingHistory && history.length === 0 && (
        <div style={{ fontSize: 14, color: "#666" }}>No closed loans yet.</div>
      )}

      {history.map((l) => {
        const rawAmount = l.deposit?.amount || l.deposit?.expected_amount || l.requestPayload?.deposit?.expected_amount || 0;
        const amount = Number(rawAmount).toFixed(3);
        
        const currentRateVal = l.currentRate ? Number(l.currentRate).toFixed(2) : "0.00";
        const marginCallVal = l.liquidationPrice ? Number(l.liquidationPrice).toFixed(2) : "0.00";
        const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "-";

        return (
          <div
            key={l.id}
            className="responsive-card"
            style={{
              width: "100%",
              height: "112px",
              borderRadius: "12.917px",
              border: "2.348px solid rgba(255, 255, 255, 0.10)",
              background: "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
              boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
              backdropFilter: "blur(20.138px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 33px 24px 25px",
              gap: 12,
              opacity: 0.85, // Slight opacity for closed loans
            }}
          >
            {/* Left Column (50%) */}
            <div className="responsive-col" style={{ display: "flex", width: "50%", justifyContent: "space-between", alignItems: "center", paddingRight: "20px" }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="resp-icon-box" style={{
                  width: 64, height: 64, borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <img src={l.ui?.collateral?.logo} alt="logo" className="resp-icon-img" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                  <span className="resp-text-xl" style={{ color: "#fff", fontSize: "26px", fontWeight: 500, lineHeight: 1 }}>
                    {amount} {l.ui?.collateral?.network}
                  </span>
                  <span className="resp-text-sm" style={{ color: "#9BA2AE", fontSize: "18px", fontWeight: 400 }}>
                    {dateStr}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                <span className="resp-text-sm" style={{ color: "#9BA2AE", fontSize: "18px", fontWeight: 400 }}>Current Rate</span>
                <span className="resp-text-lg" style={{ color: "#fff", fontSize: "22px" }}>${currentRateVal}</span>
              </div>
            </div>

            {/* Right Column (50%) */}
            <div className="responsive-col" style={{ display: "flex", width: "50%", justifyContent: "space-between", alignItems: "center", paddingLeft: "20px" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                <span className="resp-text-sm" style={{ color: "#9BA2AE", fontSize: "18px", fontWeight: 400 }}>Margin Call</span>
                <span className="resp-text-lg" style={{ color: "#fff", fontSize: "22px" }}>${marginCallVal}</span>
              </div>

              {/* Center: REPAID Status */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "50%", background: "#9BA2AE",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {/* Inline SVG Checkmark */}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="resp-text-lg" style={{ color: "#fff", fontSize: "20px", fontWeight: 500 }}>
                    {l.phase === "LIQUIDATED" ? "Liquidated" : "Repaid"} 
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/dashboard/loans/${encodeURIComponent(l.loanId || l.id)}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#4a515c")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#323841")}
                style={{
                  display: "flex", width: "38px", height: "38px", padding: "11.742px 0",
                  justifyContent: "center", alignItems: "center", borderRadius: "83px",
                  border: "1px solid rgba(255, 255, 255, 0.25)", background: "#323841",
                  cursor: "pointer", transition: "background 0.2s ease", flexShrink: 0
                }}
              >
                <img src="/assets/RightAngle.svg" alt="View loan" style={{ width: 14, height: 14 }} />
              </button>

            </div>
          </div>
        );
      })}

    </div>
  );
}
