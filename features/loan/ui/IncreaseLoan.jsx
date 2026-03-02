"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getIncreaseEstimate, refreshDepositAddress } from "@/features/loan/services/coinrabbit";
import LoanStatusLabel from "@/features/loan/ui/LoanStatusLabel";
import { useIncreaseAndPayCollateral } from "@/features/loan/hooks/useIncreaseAndPayCollateral";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export default function IncreaseLoan({ loanId }) {
  const loanIdFromUrl = String(loanId || "").trim();

    const router = useRouter();
  
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [depositOut, setDepositOut] = useState(null);
    const [depositErr, setDepositErr] = useState(null);
    const [loadingDeposit, setLoadingDeposit] = useState(false);

    const [increaseAmount, setIncreaseAmount] = useState("0.001");
    const [increaseOut, setIncreaseOut] = useState(null);
    const [increaseErr, setIncreaseErr] = useState(null);
    const [loadingIncrease, setLoadingIncrease] = useState(false);

    const [increaseFlowOut, setIncreaseFlowOut] = useState(null);
    const [increaseFlowErr, setIncreaseFlowErr] = useState("");


    const [startListen, setStartListen] = useState(false);

    // Estado para guardar la data del préstamo desde Firebase
  const [loanData, setLoanData] = useState(null);

  useEffect(() => {
    async function fetchLoanData() {
      if (!loanIdFromUrl) return;
      try {
        const docRef = doc(db, "loans", loanIdFromUrl);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLoanData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching loan data:", error);
      }
    }
    fetchLoanData();
  }, [loanIdFromUrl]);

    useEffect(() => {
        setStartListen(false);
        setIncreaseOut(null);
        setIncreaseFlowOut(null);
        setIncreaseFlowErr("");
        setIncreaseErr(null);
    }, [loanIdFromUrl]);


  const {
    run: runIncreaseFlow,
    loading: increaseFlowLoading,
    txId: increaseFlowTxId,
    error: increaseFlowHookErr,
  } = useIncreaseAndPayCollateral({ summary: null });


  const runRefreshDeposit = async (e) => {
    e?.preventDefault?.();
    setDepositErr(null);
    setDepositOut(null);

    const id = loanIdFromUrl.trim();
    if (!id) {
      setDepositErr("Missing loanId");
      return;
    }

    setLoadingDeposit(true);
    try {
        const j = await refreshDepositAddress(id); // <-- service

        const addr = j?.response?.address || null;

    setDepositOut({
        ok: true,
        status: 200,
        data: j,
        extracted: {
        address: addr,
        isSuccess: j?.result === true && !!addr,
        },
    });
    } catch (e2) {
        setDepositErr(e2.message);
        setDepositOut({
            ok: false,
            status: e2.status || 500,
            data: e2.data || { error: e2.message },
            extracted: { isSuccess: false, address: null },
    });
    } finally {
        setLoadingDeposit(false);
    }

  };

  const runIncreaseEstimate = async (e) => {
    e?.preventDefault?.();
    setIncreaseErr(null);
    setIncreaseOut(null);
    setIncreaseFlowErr("");
    setIncreaseFlowOut(null);

    const id = loanIdFromUrl.trim();
    const amount = String(increaseAmount || "").trim();

    if (!id) {
      setIncreaseErr("Missing loanId");
      return;
    }
    if (!amount) {
      setIncreaseErr("Missing amount");
      return;
    }

    setLoadingIncrease(true);
    try {
        const j = await getIncreaseEstimate(id, amount); // <-- service

        const isSuccess = j?.result === true;

        const liquidationPrice = isSuccess ? j?.response?.liquidation_price ?? null : null;
        const precision = isSuccess ? j?.response?.precision ?? null : null;
        const realIncreaseAmount = isSuccess ? j?.response?.real_increase_amount ?? null : null;
        const newAmount = isSuccess ? j?.response?.deposit?.new_amount ?? null : null;

    setIncreaseOut({
        ok: true,
        status: 200,
        data: j,
        extracted: {
        isSuccess,
        liquidationPrice,
        precision,
        amount,
        realIncreaseAmount,
        newAmount,
        },
    });
    } catch (e2) {
        setIncreaseErr(e2.message);
        setIncreaseOut({
            ok: false,
            status: e2.status || 500,
            data: e2.data || { error: e2.message },
    });
    } finally {
        setLoadingIncrease(false);
    }
  };

  const runConfirmIncrease = async () => {
    setIncreaseFlowErr("");
    setIncreaseFlowOut(null);

    const id = loanIdFromUrl.trim();
    if (!loanId) {
      setIncreaseFlowErr("Missing loanId");
      return;
    }

    const can = increaseOut?.data?.result === true;
    if (!can) {
      setIncreaseFlowErr("Run increase estimate first");
      return;
    }

    const real = increaseOut?.data?.response?.real_increase_amount;
    const amountToUse = String(real ?? increaseAmount ?? "").trim();
    if (!amountToUse) {
      setIncreaseFlowErr("Missing amount");
      return;
    }

    try {
      const res = await runIncreaseFlow({
        loanId: id,
        amount: amountToUse,
      });

      setIncreaseFlowOut(res);
      setStartListen(true);


    } catch (e) {
      setIncreaseFlowErr(e?.message || "Confirm increase failed");
    }
  };

  const boxStyle = {
    borderTop: "1px solid transparent",
    paddingTop: 16,
    display: "grid",
    gap: 8,
  };

  const increaseReady = increaseOut?.data?.result === true;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(21, 26, 35, 0.6)", backdropFilter: "blur(8px)", padding: "20px" }}>
      <div style={{ display: "inline-flex", padding: "17px 28.712px 30px 20px", flexDirection: "column", alignItems: "flex-end", gap: "30px", borderRadius: "12.917px", border: "2.348px solid rgba(255, 255, 255, 0.10)", background: "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)", boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)", backdropFilter: "blur(31.149999618530273px)", maxWidth: "620px", width: "100%" }}>
        {/* Header section with Title, Subtitle, and Close Button */}
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          
          {/* Titles container */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h2 style={{
              margin: 0,
              color: "#FFF",
              fontFamily: '"Gramatika Trial", sans-serif',
              fontSize: "28px",
              fontStyle: "normal",
              fontWeight: 500,
              lineHeight: "normal"
            }}>
              Increase Collateral
            </h2>
            <p style={{
              margin: 0,
              color: "var(--Gray-Chateau, var(--color-azure-65, #9CA3AF))",
              fontFamily: "var(--font-family-Font-2, ABeeZee, sans-serif)",
              fontSize: "16px",
              fontStyle: "normal",
              fontWeight: "var(--font-weight-400, 400)",
              lineHeight: "var(--font-size-20, 20px)"
            }}>
              Add collateral to lower your margin call and avoid liquidation
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => router.push("/dashboard/loans")}
            style={{
              background: "transparent",
              color: "#FFFFFF",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
              lineHeight: "1",
              opacity: 0.7,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {showAdvanced && (
          <div style={{ ...boxStyle, background: '#f8fff0', borderRadius: 10, border: '1.5px solid #a0ff2f' }}>
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>Refresh deposit address, Update expired deposit transaction (Fallback)</h3>
            <form onSubmit={runRefreshDeposit} style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                disabled={loadingDeposit || !refreshLoanId.trim()}
                style={{
                  padding: '10px 18px',
                  background: 'var(--color-primary-500)',
                  color: '#222',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: loadingDeposit || !refreshLoanId.trim() ? 'not-allowed' : 'pointer',
                  opacity: loadingDeposit || !refreshLoanId.trim() ? 0.6 : 1,
                  boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
                }}
              >
                {loadingDeposit ? "Calling..." : "RefreshDeposit"}
              </button>
            </form>

            {depositOut?.extracted?.isSuccess && (
              <div style={{ padding: 10, border: "1px solid #cfc", background: "#f6fff6", borderRadius: 8, marginTop: 8 }}>
                <div>
                  <b>OK:</b> deposit address returned
                </div>
                <div>
                  <b>address:</b> {depositOut.extracted.address}
                </div>
              </div>
            )}

            {depositErr && <pre style={{ color: "red" }}>{depositErr}</pre>}
          </div>
        )}

        <div style={{ ...boxStyle, background: 'transparent' }}>
          <div style={{ color: "var(--Gray-Chateau, var(--color-azure-65, #9CA3AF))",
              fontFamily: "var(--font-family-Font-2, ABeeZee, sans-serif)",
              fontSize: "16px", }}>
            Loan ID: <b>{loanIdFromUrl || "(empty)"}</b>
          </div>

            <p style={{
              marginTop: 10,
              color: "#fff",
              fontFamily: "var(--font-family-Font-2, ABeeZee, sans-serif)",
              fontSize: "16px",
              fontStyle: "normal",
              fontWeight: "var(--font-weight-400, 400)",
              lineHeight: "var(--font-size-20, 20px)"
            }}>
              Amount to add
            </p>

          <form
            onSubmit={runIncreaseEstimate}
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Input wrapper containing both the text field and the token/network badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "6px 6px 6px 14px", // Less padding on the right to fit the badge nicely
              borderRadius: "9.394px",
              border: "1.174px solid #1F242F",
              background: "#161B26",
              boxSizing: "border-box"
            }}>
              
              {/* Transparent input field */}
              <input
                value={increaseAmount}
                onChange={(e) => setIncreaseAmount(e.target.value)}
                placeholder="amount (e.g. 0.001)"
                className="custom-input"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#FFF",
                  fontSize: "17px",
                  outline: "none",
                  fontWeight: 500,
                  minWidth: 0, // Prevents flex blowout
                }}
              />

              {/* Token and Network badge */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 8px",
                borderRadius: "11.742px",
                background: "#323841"
              }}>
                {/* Dynamic Circular Icon */}
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden"
                }}>
                  {loanData?.ui?.collateral?.logo && (
                    <img 
                      src={loanData.ui.collateral.logo} 
                      alt="icon" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  )}
                </div>

                {/* Dynamic Token Symbol */}
                <span style={{ color: "#FFF", fontSize: "14px", fontWeight: 600 }}>
                  {loanData?.ui?.collateral?.code || "..."}
                </span>

                {/* Dynamic Network label */}
                <div style={{
                  background: "#151A23",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  color: "#9CA3AF",
                  fontSize: "12px",
                  fontWeight: 500
                }}>
                  {loanData?.ui?.collateral?.network || "..."}
                </div>
              </div>
            </div>
            
            {/* Estimate Results - Shows up above the confirm button */}
            {increaseOut?.extracted?.isSuccess && (
              <div
                style={{
                  borderRadius: "9.394px",
                  background: "#323841",
                  padding: "25px 23.485px",
                  width: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px", // Space between the two rows
                }}
              >
                {/* Deposit becomes row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#9CA3AF", fontSize: "16px", fontWeight: 500 }}>
                    Deposit becomes
                  </span>
                  <span style={{ color: "#FFF", fontSize: "16px", fontWeight: 600 }}>
                    {String(increaseOut.extracted?.newAmount)}
                  </span>
                </div>

                {/* Margin call becomes row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#9CA3AF", fontSize: "16px", fontWeight: 500 }}>
                    Margin call becomes
                  </span>
                  <span style={{ color: "#FFF", fontSize: "16px", fontWeight: 600 }}>
                    {/* Convert to Number and format to 2 decimal places */}
                    {increaseOut.extracted?.liquidationPrice 
                      ? Number(increaseOut.extracted.liquidationPrice).toFixed(2) 
                      : ""}
                  </span>
                </div>
              </div>
            )}
            {/* API Error Message */}
          {increaseOut && !increaseOut?.extracted?.isSuccess && (
            <div
              style={{
                padding: "16px",
                border: "1px solid #ef4444", // Red border
                background: "rgba(239, 68, 68, 0.1)", // Dark transparent red
                borderRadius: "9.394px",
                marginTop: "16px",
                color: "#fca5a5", // Light red text
                fontSize: "15px",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                CoinRabbit error: <span style={{ fontWeight: 400 }}>{increaseOut?.data?.response?.error || "Unknown error"}</span>
              </div>
              <pre style={{ background: "rgba(0,0,0,0.2)", color: "#fca5a5", borderRadius: "6px", padding: "10px", fontSize: "13px", margin: 0, overflowX: "auto" }}>
                {JSON.stringify(increaseOut?.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Smart Contract / Flow Error Message */}
          {(increaseFlowErr || increaseFlowHookErr) && (
            <div style={{ 
              padding: "12px 16px", 
              border: "1px solid #ef4444", 
              background: "rgba(239, 68, 68, 0.1)", 
              borderRadius: "9.394px", 
              marginTop: "16px", 
              color: "#fca5a5",
              width: "100%",
              boxSizing: "border-box" 
            }}>
              <b>Increase flow error:</b> {increaseFlowErr || increaseFlowHookErr}
            </div>
          )}
          
          {/* General Catch-all Error */}
          {increaseErr && (
            <pre style={{ 
              color: "#fca5a5", 
              marginTop: "16px", 
              background: "rgba(239, 68, 68, 0.1)", 
              padding: "12px", 
              borderRadius: "9.394px" 
            }}>
              {increaseErr}
            </pre>
          )}

            {/* Conditional Action Button: Show Estimate first, then swap to Confirm */}
            {/* ... (Tus botones de Get Estimate y Confirm van aquí abajo) ... */}

            {/* Conditional Actions: Success Message -> Estimate Button -> Confirm Button */}
            {!!increaseFlowTxId ? (
              <div style={{
                width: "100%",
                padding: "16px",
                border: "1px solid var(--color-primary-500, #95E100)",
                background: "rgba(149, 225, 0, 0.1)", // #95E100 with 10% opacity
                borderRadius: "8px",
                color: "var(--color-primary-500, #95E100)",
                textAlign: "left",
                boxSizing: "border-box",
                overflowWrap: "anywhere"
              }}>
                <b style={{ display: "block", marginBottom: "4px", fontSize: "16px" }}>Transaction Sent!</b>
                <span style={{ fontFamily: "monospace", color: "#FFF", fontSize: "14px" }}>
                  {increaseFlowTxId}
                </span>
              </div>
            ) : !increaseReady ? (
              <button
                type="submit"
                disabled={loadingIncrease || !loanIdFromUrl.trim()}
                style={{
                  width: "100%",
                  padding: "12px 22px",
                  background: "var(--color-primary-500, #95E100)",
                  color: "#222",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "17px",
                  letterSpacing: "0.5px",
                  cursor: loadingIncrease || !loanIdFromUrl.trim() ? "not-allowed" : "pointer",
                  opacity: loadingIncrease || !loanIdFromUrl.trim() ? 0.6 : 1,
                  boxShadow: "0 2px 8px 0 rgba(149,225,0,0.10)",
                  boxSizing: "border-box"
                }}
              >
                {loadingIncrease ? "Loading..." : "Get Increase Estimate"}
              </button>
            ) : (
              <button
                type="button"
                onClick={runConfirmIncrease}
                disabled={increaseFlowLoading}
                style={{
                  width: "100%",
                  padding: "12px 22px",
                  background: "var(--color-primary-500, #95E100)",
                  color: "#222",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "17px",
                  letterSpacing: "0.5px",
                  cursor: increaseFlowLoading ? "not-allowed" : "pointer",
                  opacity: increaseFlowLoading ? 0.6 : 1,
                  boxShadow: "0 2px 8px 0 rgba(149,225,0,0.10)",
                  boxSizing: "border-box"
                }}
              >
                {increaseFlowLoading ? "Opening wallet..." : "Confirm Increase"}
              </button>
            )}
          </form>
          <LoanStatusLabel loanId={loanIdFromUrl.trim()} start={startListen} />


          {/* {increaseOut?.extracted?.isSuccess && (
            <div
              style={{
                padding: 18,
                border: "2px solid #a0ff2f",
                background: "#fff",
                borderRadius: 10,
                marginTop: 18,
                marginBottom: 8,
                boxShadow: '0 2px 12px 0 rgba(160,255,47,0.08)',
                color: '#1a1a1a',
                fontSize: 16,
                fontWeight: 500
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <b>Requested:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.amount)}</span>
              </div>
              <div>
                <b>Real increase amount:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.realIncreaseAmount)}</span>
              </div>
              <div>
                <b>New amount:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.newAmount)}</span>
              </div>
              <div>
                <b>Liquidation price:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.liquidationPrice)}</span>
              </div>
              <div>
                <b>Precision:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.precision)}</span>
              </div>
            </div>
          )} */}
          {/* 
          {increaseOut && !increaseOut?.extracted?.isSuccess && (
            <div
              style={{
                padding: 18,
                border: "2px solid #f87171",
                background: "#fff",
                borderRadius: 10,
                marginTop: 18,
                marginBottom: 8,
                boxShadow: '0 2px 12px 0 rgba(248,113,113,0.08)',
                color: '#b91c1c',
                fontSize: 16,
                fontWeight: 500
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <b>CoinRabbit error:</b> <span style={{ color: '#b91c1c' }}>{increaseOut?.data?.response?.error || "Unknown error"}</span>
              </div>
              <pre style={{ background: '#fef2f2', color: '#222', borderRadius: 6, padding: 10, fontSize: 14, margin: 0, overflowX: 'auto' }}>{JSON.stringify(increaseOut?.data, null, 2)}</pre>
            </div>
          )}

              {(increaseFlowErr || increaseFlowHookErr) && (
              <div style={{ padding: 12, border: "1px solid #fca5a5", background: "#fef2f2" }}>
                  <b>Increase flow error:</b> {increaseFlowErr || increaseFlowHookErr}
              </div>
              )}

              {!!increaseFlowTxId && (
              <div style={{ padding: 12, border: "1px solid #cfc", background: "#f6fff6" }}>
                  <b>Sent:</b> <span style={{ fontFamily: "monospace" }}>{increaseFlowTxId}</span>
              </div>
              )}
              {increaseErr && <pre style={{ color: "red" }}>{increaseErr}</pre>} */}
        </div>

        
        <div style={{ fontSize: 12, color: "#666" }}>
          If the deposit gets stuck or the address expires, you can{" "}
          <span
            onClick={() => setShowAdvanced((s) => !s)}
            style={{
              color: "var(--color-primary-500)",
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            refresh the deposit address
          </span>
          .
        </div>

      </div>
    </div>
  );
}
