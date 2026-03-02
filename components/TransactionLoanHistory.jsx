"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

// --- Helpers ---

// Shorten address or ID
function shortAddr(a) {
  if (!a) return "-";
  const s = String(a);
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

// Format date to: Jan 03, 2026, 05:15 PM
function formatExactDate(ms) {
  if (!ms) return "-";
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "-";
  
  const month = d.toLocaleString('en-US', { month: 'short' }); 
  const day = d.toLocaleString('en-US', { day: '2-digit' });   
  const year = d.getFullYear();                                
  
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const hoursStr = hours.toString().padStart(2, '0');          
  
  return `${month} ${day}, ${year}, ${hoursStr}:${minutes} ${ampm}`;
}

export default function TransactionHistory() {
  const router = useRouter();

  // Global states
  const [uid, setUid] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sorting and type selection states
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [selectedType, setSelectedType] = useState("collateral"); // "collateral", "loan", "interest"

  // Handle sorting logic
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // 1) Detect logged-in user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid || null);
    });
    return () => unsub();
  }, []);

  // 2) Fetch closed/liquidated loans from Firestore
  useEffect(() => {
    if (!uid) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);

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
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error("HISTORY SNAPSHOT ERROR:", err);
        setError(err?.message || "Snapshot error");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  // 3) Filter logic (Search + Month)
  const filteredHistory = useMemo(() => {
    return (history || []).filter((loan) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        loan.ui?.collateral?.network?.toLowerCase().includes(searchLower) ||
        loan.loanId?.toLowerCase().includes(searchLower) ||
        loan.id?.toLowerCase().includes(searchLower);

      // Month filter
      let matchesMonth = true;
      if (selectedMonth !== "ALL" && loan.createdAt) {
        const loanDate = new Date(loan.createdAt);
        const now = new Date();
        
        if (selectedMonth === "THIS_MONTH") {
          matchesMonth = loanDate.getMonth() === now.getMonth() && loanDate.getFullYear() === now.getFullYear();
        } else if (selectedMonth === "LAST_MONTH") {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          matchesMonth = loanDate.getMonth() === lastMonth.getMonth() && loanDate.getFullYear() === lastMonth.getFullYear();
        }
      }

      return matchesSearch && matchesMonth;
    });
  }, [history, searchTerm, selectedMonth]);

  // 4) Apply sorting
  const sortedHistory = useMemo(() => {
    let sortableItems = [...filteredHistory];
    
    sortableItems.sort((a, b) => {
      if (sortConfig.key === "date") {
        const dateA = a.createdAt || 0;
        const dateB = b.createdAt || 0;
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (sortConfig.key === "amount") {
        const getAmount = (loan) => {
          if (selectedType === "collateral") return Number(loan.deposit?.expected_amount || 0);
          if (selectedType === "loan") return Number(loan.borrow?.expected_amount || 0);
          if (selectedType === "interest") return Number(loan.monthlyInterest || 0);
          return 0;
        };
        const amountA = getAmount(a);
        const amountB = getAmount(b);
        return sortConfig.direction === "asc" ? amountA - amountB : amountB - amountA;
      }
      return 0;
    });
    
    return sortableItems;
  }, [filteredHistory, sortConfig, selectedType]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", marginTop: 32 }}>
      
      {/* --- Mobile & Responsive CSS --- */}
      <style>{`
        .mobile-label { display: none; }
        @media (max-width: 768px) {
          .history-title { font-size: 32px !important; line-height: 40px !important; }
          .history-controls-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .history-search-inner { grid-template-columns: 1fr !important; }
          .history-search-box { grid-column: span 1 !important; width: 100% !important; }
          .history-filter-wrapper { justify-content: flex-start !important; }
          .history-filter-btn { width: 100% !important; }
          
          .history-table-header { display: none !important; }
          .history-table-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding: 20px !important;
          }
          .mobile-flex-col {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .mobile-label { 
            display: block; 
            color: #9BA2AE; 
            font-size: 14px; 
          }
          .status-col { justify-content: flex-end !important; }
        }
      `}</style>

      {/* --- Main Title --- */}
      <h3 
        className="history-title" 
        style={{ 
          margin: 0, 
          color: "#FFF",
          fontFamily: '"Gramatika Trial", sans-serif',
          fontSize: "48px",
          fontStyle: "normal",
          fontWeight: 500,
          lineHeight: "64.142px",
          letterSpacing: "0.988px"
        }}
      >
        Transaction History
      </h3>

      {/* --- Controls: Search and Filters --- */}
      <div 
        className="history-controls-grid"
        style={{ 
          display: "grid", 
          gridTemplateColumns: "2fr 1fr",
          gap: "24px", 
          marginBottom: "24px",
          marginTop: "16px"
        }}
      >
        {/* Left Side: Search */}
        <div 
          className="history-search-inner"
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "16px" 
          }}
        >
          <div 
            className="history-search-box"
            style={{ 
              gridColumn: "span 2",
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              borderRadius: "9.394px",
              background: "#323841",
              padding: "11.742px 23.485px",
              height: "64px",
              width: "calc(100% + 25px)",
              boxSizing: "border-box"
            }}
          >
            <input 
              type="text" 
              placeholder="Search by network or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                width: "100%",
                outline: "none",
                fontFamily: '"Gramatika Trial", sans-serif',
                fontSize: "16px",
                padding: 0
              }}
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginLeft: 12 }}>
              <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#9BA2AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21L16.65 16.65" stroke="#9BA2AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        {/* Right Side: Month Filter */}
        <div 
          className="history-filter-wrapper"
          style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            alignItems: "center"
          }}
        >
          <div 
            className="history-filter-btn"
            style={{ position: "relative", height: "64px", width: "220px" }}
          >
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 23px",
                borderRadius: "9.394px",
                border: "none",
                background: "#323841", 
                color: "#9BA2AE",
                fontFamily: '"Gramatika Trial", sans-serif',
                fontSize: "16px",
                fontWeight: 400,
                cursor: "pointer",
                height: "100%",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#9BA2AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6" stroke="#9BA2AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V6" stroke="#9BA2AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H21" stroke="#9BA2AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {selectedMonth === "ALL" ? "All Time" : selectedMonth === "THIS_MONTH" ? "This month" : "Last month"}
              </div>
              <svg 
                width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
                style={{ transform: isDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              >
                <path d="M6 9L12 15L18 9" stroke="#9BA2AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown Options */}
            {isDropdownOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                width: "100%",
                background: "#323841",
                borderRadius: "9.394px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}>
                {[
                  { id: "ALL", label: "All Time" },
                  { id: "THIS_MONTH", label: "This month" },
                  { id: "LAST_MONTH", label: "Last month" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedMonth(opt.id);
                      setIsDropdownOpen(false);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = selectedMonth === opt.id ? "rgba(255, 255, 255, 0.05)" : "transparent"}
                    style={{
                      padding: "16px 23px",
                      background: selectedMonth === opt.id ? "rgba(255, 255, 255, 0.05)" : "transparent",
                      border: "none",
                      color: selectedMonth === opt.id ? "#FFF" : "#9BA2AE",
                      fontFamily: '"Gramatika Trial", sans-serif',
                      fontSize: "16px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- States: Loading & Empty --- */}
      {loading && <div style={{ fontSize: 14, color: "#666" }}>Loading history...</div>}
      {error && <div style={{ color: "red", fontSize: 12 }}>{error}</div>}
      {!loading && filteredHistory.length === 0 && (
        <div style={{ fontSize: 14, color: "#666", textAlign: "center", padding: "40px" }}>No history found.</div>
      )}

      {/* --- Table Section --- */}
      {filteredHistory.length > 0 && (
        <>
          {/* Table Header */}
          <div 
            className="history-table-header"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.2fr 1fr 1.5fr 0.8fr",
              gap: "16px",
              padding: "0 24px 12px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: "16px",
              color: "#9BA2AE",
              fontFamily: '"Gramatika Trial", sans-serif',
              fontSize: "16px",
              fontWeight: 500,
              alignItems: "center"
            }}
          >
            <div onClick={() => requestSort("date")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              Date {sortConfig.key === "date" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Type:
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", color: "#FFF", fontFamily: '"Gramatika Trial", sans-serif', fontSize: "14px", padding: "2px 4px", outline: "none", cursor: "pointer" }}>
                <option value="collateral" style={{ background: "#323841" }}>Collateral</option>
                <option value="loan" style={{ background: "#323841" }}>Loan</option>
                <option value="interest" style={{ background: "#323841" }}>Interest</option>
              </select>
            </div>
            <div onClick={() => requestSort("amount")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              Amount {sortConfig.key === "amount" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
            </div>
            <div>Internal ID</div>
            <div style={{ textAlign: "right" }}>Status</div>
          </div>

          {/* Table Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sortedHistory.map((l, index) => {
              // 1. Exact Date Format
              const dateStr = formatExactDate(l.createdAt);

              // 2. Amount & Type setup
              let amountVal = 0;
              let currencyCode = "";
              let typeLabel = "";
              let TypeIcon = null;

              if (selectedType === "collateral") {
                amountVal = Number(l.deposit?.amount || l.deposit?.expected_amount || l.requestPayload?.deposit?.expected_amount || 0);
                currencyCode = l.ui?.collateral?.network || l.deposit?.currency || "";
                typeLabel = "Collateral";
                TypeIcon = (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="16 6 23 6 23 13"></polyline>
                  </svg>
                );
              } else if (selectedType === "loan") {
                amountVal = Number(l.borrow?.amount || l.borrow?.expected_amount || l.requestPayload?.loan?.expected_amount || 0);
                currencyCode = l.ui?.borrow?.network || l.borrow?.currency || "";
                typeLabel = "Loan";
                TypeIcon = (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M6 12h.01M18 12h.01"></path>
                  </svg>
                );
              } else if (selectedType === "interest") {
                amountVal = Number(l.monthlyInterest || 0);
                currencyCode = "%";
                typeLabel = "Interest";
                TypeIcon = (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="5" x2="5" y2="19"></line>
                    <circle cx="6.5" cy="6.5" r="2.5"></circle>
                    <circle cx="17.5" cy="17.5" r="2.5"></circle>
                  </svg>
                );
              }

              const amountStr = selectedType === "interest" ? `${amountVal.toFixed(2)}%` : `${amountVal.toFixed(3)} ${currencyCode}`;
              
              // 3. Just Internal ID
              const internalId = l.loanId || l.id || "N/A";
              const displayId = shortAddr(internalId);

              // 4. Status
              const isSuccess = l.phase !== "FAILED"; 
              const statusText = isSuccess ? "Success" : "Failed";
              const statusColor = isSuccess ? "#95E100" : "#FF4D4F";

              // 5. Zebra Styling
              const hasBg = index % 2 === 0;
              const rowStyles = hasBg ? {
                borderRadius: "12.917px",
                border: "2.348px solid rgba(255, 255, 255, 0.10)",
                background: "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
                boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
                backdropFilter: "blur(20.138px)"
              } : {
                borderRadius: "12.917px",
                border: "2.348px solid transparent",
                background: "transparent",
                boxShadow: "none",
                backdropFilter: "none"
              };

              return (
                <div
                  key={l.id}
                  className="history-table-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.2fr 1fr 1.5fr 0.8fr",
                    gap: "16px",
                    padding: "16px 24px",
                    alignItems: "center",
                    color: "#FFF",
                    fontFamily: '"Gramatika Trial", sans-serif',
                    fontSize: "16px",
                    fontWeight: 400,
                    ...rowStyles
                  }}
                >
                  {/* Col 1: Date */}
                  <div className="mobile-flex-col">
                    <span className="mobile-label">Date</span>
                    {dateStr}
                  </div>

                  {/* Col 2: Type */}
                  <div className="mobile-flex-col">
                    <span className="mobile-label">Type</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        display: "flex", width: "44px", height: "44px", padding: "13px",
                        justifyContent: "center", alignItems: "center", borderRadius: "12px",
                        background: "#323841", flexShrink: 0
                      }}>
                        {TypeIcon}
                      </div>
                      <span>{typeLabel}</span>
                    </div>
                  </div>

                  {/* Col 3: Amount */}
                  <div className="mobile-flex-col">
                    <span className="mobile-label">Amount</span>
                    {amountStr}
                  </div>

                  {/* Col 4: Internal ID */}
                  <div className="mobile-flex-col">
                    <span className="mobile-label">Internal ID</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#9BA2AE" }}>{displayId}</span>
                      
                      {internalId !== "N/A" && (
                        <button 
                          onClick={() => navigator.clipboard.writeText(internalId)}
                          style={{
                            background: "transparent", border: "none", cursor: "pointer", 
                            padding: "4px", display: "flex", alignItems: "center", justifyContent: "center"
                          }}
                          title="Copy Full ID"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Col 5: Status */}
                  <div className="mobile-flex-col status-col" style={{ textAlign: "right", color: statusColor, fontWeight: 500 }}>
                    {statusText}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}