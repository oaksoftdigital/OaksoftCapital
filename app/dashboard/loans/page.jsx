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

      {loans.map((l) => (
        <div
          key={l.id}
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
            padding: "0 20px", // Updated padding for fixed height
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 600 }}>Loan {l.loanId || l.id}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <TokenChip
                logo={l.ui?.collateral?.logo}
                code={l.ui?.collateral?.code}
                network={l.ui?.collateral?.network}
              />
              <span style={{ color: "#999" }}>→</span>
              <TokenChip
                logo={l.ui?.borrow?.logo}
                code={l.ui?.borrow?.code}
                network={l.ui?.borrow?.network}
              />
            </div>

            <div style={{ fontSize: 12, color: "#666" }}>
              status: {l.status || l.coinrabbit?.status || "-"}
            </div>
            <LoanZonePill zone={l.coinrabbit?.currentZone} showWhenUnknown />
          </div>

          <button
            onClick={() => router.push(`/dashboard/loans/${encodeURIComponent(l.loanId || l.id)}`)}
            style={{
              padding: "10px 14px",
              background: "var(--color-primary-500)",
              color: "#222",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Open
          </button>
        </div>
      ))}

      <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />

      <h3 style={{ fontWeight: 600, fontSize: 18, margin: 0 }}>History</h3>

      {loadingHistory && <div style={{ fontSize: 14, color: "#666" }}>Loading history...</div>}
      {historyErr && <div style={{ color: "red", fontSize: 12 }}>{historyErr}</div>}

      {!loadingHistory && history.length === 0 && (
        <div style={{ fontSize: 14, color: "#666" }}>No closed loans yet.</div>
      )}

      {history.map((l) => (
        <div
          key={l.id}
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
              padding: "0 20px", // Updated padding for fixed height
              gap: 12,
            }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 600 }}>Loan {l.loanId || l.id}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <TokenChip
                logo={l.ui?.collateral?.logo}
                code={l.ui?.collateral?.code}
                network={l.ui?.collateral?.network}
              />
              <span style={{ color: "#999" }}>→</span>
              <TokenChip
                logo={l.ui?.borrow?.logo}
                code={l.ui?.borrow?.code}
                network={l.ui?.borrow?.network}
              />
            </div>

            <div style={{ fontSize: 12, color: "#666" }}>
              phase: {l.phase || "-"} | status: {l.status || l.coinrabbit?.status || "-"}
            </div>
          </div>

          <button
            onClick={() => router.push(`/dashboard/loans/${encodeURIComponent(l.loanId || l.id)}`)}
            style={{
              padding: "10px 14px",
              background: "#eee",
              color: "#444",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View
          </button>
        </div>
      ))}

    </div>
  );
}
