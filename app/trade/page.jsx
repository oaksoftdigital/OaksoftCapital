"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import SwapColumn from "../../components/Swap";
import ChartSmart from "../../components/ChartSmart";
import ExecutionFlowModal from "@/components/ExecutionFlowModal";
//fiat onramp
import KoyweWidget from "../../components/OnRamp/KoyweWidget"; 
import { useAccount } from "wagmi";


function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" strokeWidth="2" />
    </svg>
  );
}
function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M3 3l18 18" />
      <path strokeWidth="2" d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42M9.88 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a20.34 20.34 0 01-5.07 6.13M6.61 6.61A20.78 20.78 0 001 12s4 8 11 8a10.77 10.77 0 005.39-1.46" />
    </svg>
  );
}
function shorten(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}
function displayToken(t, fallback = "TOKEN") {
  // Priority: SYMBOL > NAME (upper 1st word) > short address > fallback
  if (t?.symbol) return t.symbol;
  if (t?.name) return String(t.name).toUpperCase().split(" ")[0];
  if (t?.address) return shorten(t.address);
  return fallback;
}

export default function Trade() {
  // Timings
  const HIDE_MS = 300;        // fade-out when hiding
  const WIDTH_MS = 420;       // column width (outer container)
  const SHOW_MS = 1200;       // chart reveal (reappearance)
  const SHOW_DELAY = 120;     // slight delay before triggering the reveal

  const [chartState, setChartState] = useState("visible"); // "visible" | "hiding" | "hidden" | "showing"
  const hideTimer = useRef(null);
  const showTimer = useRef(null);

  const onToggleChart = () => {
    if (chartState === "visible" || chartState === "showing") {
      // HIDE: only fade and collapse width quickly
      setChartState("hiding");
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setChartState("hidden"), HIDE_MS);
    } else {
      // SHOW: expand container quickly and then REVEAL from right→left
      setChartState("showing"); // prepares w-0 for the reveal
      if (showTimer.current) clearTimeout(showTimer.current);
      showTimer.current = setTimeout(() => setChartState("visible"), SHOW_DELAY); // triggers the w-full reveal
    }
  };

  const [sell, setSell] = useState({ symbol: "ETH", name: "ETHEREUM", address: null, chainId: 1 });
  const [buy,  setBuy ] = useState({ symbol: "USDC", name: "USD COIN", address: null, chainId: 1 });

  const [activeTab, setActiveTab] = useState("SELL"); // "SELL" | "BUY"
  const current = activeTab === "SELL" ? sell : buy;

  const [showExecutionModal, setShowExecutionModal] = useState(false);

  // --- NEW STATE FOR TABS (SWAP vs ONRAMP) ---
  const [tradeMode, setTradeMode] = useState("SWAP"); // "SWAP" | "ONRAMP"
  
  // Get user address for Koywe widget
  const { address } = useAccount();

const handleSellTokenChange = useCallback((t) => {
  setSell({
    symbol: (t?.symbol || null) ? String(t.symbol).toUpperCase() : null,
    name: t?.name || null,
    address: t?.address || t?.token?.address || null,
    chainId: t?.chainId || t?.token?.chainId || 1,
  });
}, []);

const handleBuyTokenChange = useCallback((t) => {
  setBuy({
    symbol: (t?.symbol || null) ? String(t.symbol).toUpperCase() : null,
    name: t?.name || null,
    address: t?.address || t?.token?.address || null,
    chainId: t?.chainId || t?.token?.chainId || 1,
  });
}, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, []);

  const isHidden = chartState === "hidden";
  const isCollapsing = chartState === "hiding" || chartState === "hidden"; // right side centers quickly

  // --- REVEAL MASK ---
  // The internal "reveal" sticks to the right (ml-auto) and animates width 0→100%.
  const revealWidthClass =
    chartState === "showing" ? "w-0"
    : chartState === "visible" ? "w-full"
    : chartState === "hiding" ? "w-full"
    : "w-0"; // hidden

  const revealOpacityClass =
    chartState === "showing" ? "opacity-0"
    : chartState === "visible" ? "opacity-100"
    : chartState === "hiding" ? "opacity-0"
    : "opacity-0";

    const iconBaseStyle = {
      width: "68px",
      height: "68px",
      padding: "20px",
      boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
      backdropFilter: "blur(20.138256072998047px)",
      WebkitBackdropFilter: "blur(20.138256072998047px)",
    };

  return (
    <div className="min-h-screen bg-transparent w-full">

      {/* Title */}
      <div
        className="flex justify-center pt-[60px] mb-[60px]"
        style={{ width: "292.07px", height: "76.8px", marginLeft: "auto", marginRight: "auto" }}
      >
        <h1
          className="text-white text-center align-middle uppercase"
          style={{
            fontFamily: "var(--font-abhaya-libre), serif",
            fontWeight: 800,
            fontSize: "48px",
            lineHeight: "76.8px",
            letterSpacing: "11px",
          }}
        >
          TRADE
        </h1>
      </div>

      {/* Main Trade Section */}
      <div className="w-full mt-[100px]" style={{ background: "transparent" }}>
        <div className="w-full max-w-none mx-auto px-6 py-8 mt-[100px] lg:max-w-[calc(100%-200px)]">
          <div className="flex flex-col lg:flex-row gap-8 relative">
            {/* LEFT (Chart) - outer container: reserved layout width */}
            <div
              className={[
                "overflow-hidden transition-[width,height] duration-[420ms]",
                "ease-[cubic-bezier(0.33,0,0.2,1)]",
                isCollapsing ? "w-0 h-0 lg:h-auto lg:w-0" : "w-full lg:w-[60%]",
              ].join(" ")}
              aria-hidden={isHidden}
              style={{ transitionDuration: `${WIDTH_MS}ms` }}
            >
              {/* REVEAL: anchors to the right and expands its width (left border travels from right→left) */}
              <div
                className={[
                  "ml-auto",                     // anchor to the right
                  "transition-[width,opacity] ", // animate only width + opacity
                  "duration-[1200ms]",
                  "ease-[cubic-bezier(0.16,1,0.3,1)]",
                  revealWidthClass,
                  revealOpacityClass,
                ].join(" ")}
                style={{
                  willChange: "width, opacity",
                  transitionDuration:
                    chartState === "showing" || chartState === "visible"
                      ? `${SHOW_MS}ms`
                      : chartState === "hiding"
                      ? `${HIDE_MS}ms`
                      : undefined,
                }}
              >
                {/* TOKEN TABS AS TITLES */}
                <div className="mb-6 flex gap-1">
                  <button
                    onClick={() => setActiveTab("SELL")}
                    className={`text-2xl font-semibold transition-all duration-200 ${
                      activeTab === "SELL" 
                        ? "text-white border-b-2 border-red-400 pb-1" 
                        : "text-white/60 hover:text-white/80 pb-1"
                    }`}
                  >
                    {displayToken(sell, "SELL")}

                  </button>
                  <span className="text-white/40 text-2xl font-semibold self-end pb-1 mx-2">/</span>
                  <button
                    onClick={() => setActiveTab("BUY")}
                    className={`text-2xl font-semibold transition-all duration-200 ${
                      activeTab === "BUY" 
                        ? "text-white border-b-2 border-green-400 pb-1" 
                        : "text-white/60 hover:text-white/80 pb-1"
                    }`}
                  >
                    {displayToken(buy, "BUY")}
                  </button>
                </div>

                <div 
                  className="h-[500px] w-full relative border border-white/10"
                  style={{
                    borderRadius: '12px',
                    background: 'rgba(31, 41, 55, 1)',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      clipPath: 'inset(0px round 11px)',
                      WebkitClipPath: 'inset(0px round 11px)'
                    }}
                  >
                    
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <ChartSmart   
                        symbol={current.symbol}
                        name={current.name}
                        address={current.address}
                        chainId={current.chainId} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT (Swap) */}

            <div
              className={[
                "transition-[width] duration-[420ms]",
                "ease-[cubic-bezier(0.33,0,0.2,1)]",
                isCollapsing ? "w-full lg:w-[720px] lg:max-w-[720px] mx-auto" : "lg:w-[40%]",
                isCollapsing ? "flex flex-col items-center text-center" : "",
              ].join(" ")}
              style={{ transitionDuration: `${WIDTH_MS}ms` }}
            >
              {/* --- MODE TABS (SWAP | BUY CRYPTO) --- */}
              {/* --- TABS --- */}
              <div className={`flex items-center gap-6 mb-6 ${isCollapsing ? "justify-center" : "justify-center lg:justify-start"}`}>
                  <button
                    onClick={() => setTradeMode("SWAP")}
                    className={`px-4 py-2 text-lg font-bold transition-colors ${
                      tradeMode === "SWAP" 
                      ? "text-white border-b-2 border-blue-500" 
                      : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    SWAP
                  </button>
                  <button
                    onClick={() => setTradeMode("ONRAMP")}
                    className={`px-4 py-2 text-lg font-bold transition-colors ${
                      tradeMode === "ONRAMP" 
                      ? "text-white border-b-2 border-blue-500" 
                      : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    BUY CRYPTO
                  </button>
              </div>
              {/* SWAP TITLE */}
              {/* <div className={["mb-6", isCollapsing ? "text-center" : "text-center lg:text-left"].join(" ")}>
                <h2 className="text-white text-2xl font-semibold">SWAP</h2>
              </div> */}

              {/* component SwapColumn */}
              {/* component Container */}
              <div className={isCollapsing ? "flex flex-col items-center w-full" : "md:flex md:justify-center lg:justify-start"}>
                
                {/* CONDITIONAL LOGIC: Check tradeMode state */}
                {tradeMode === "SWAP" ? (
                  // Case A: Show Swap
                  <SwapColumn
                    onSellTokenChange={handleSellTokenChange}
                    onBuyTokenChange={handleBuyTokenChange}
                  />
                ) : (
                  // Case B: Show Koywe Widget (On-Ramp)
                  // We wrap it in a div to control max width, matching the Swap UI style
                  <div className="w-full max-w-[480px]">
                      <KoyweWidget 
                          userAddress={address} 
                          symbol="USDC" 
                          network="polygon" 
                      />
                  </div>
                )}

              </div>

              {/* --- CONTROL BAR (Hide Chart + How it works) --- */}
              <div 
                className={`mt-6 w-full flex ${
                  isCollapsing 
                    ? "flex-col items-center justify-center gap-4" 
                    : "flex-col items-center gap-4 lg:flex-row" 
                }`}
              >
                {/* 1. TOGGLE BUTTON (Hide/Expand Chart) */}
                <button
                  onClick={onToggleChart}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2 border border-white/30 text-white hover:border-white/60 transition whitespace-nowrap"
                  aria-pressed={!isHidden}
                >
                  {isHidden ? (
                    <>
                      <EyeIcon className="w-5 h-5" />
                      Expand chart
                    </>
                  ) : (
                    <>
                      <EyeOffIcon className="w-5 h-5" />
                      Hide chart
                    </>
                  )}
                </button>

                {/* 2. HOW IT WORKS BUTTON */}
                <button
                  onClick={() => setShowExecutionModal(true)}
                  className="group flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-transparent border-none outline-none whitespace-nowrap"
                >
                  {/* Info Icon (Circle 'i') */}
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  
                  <span className="text-sm font-medium border-b border-transparent group-hover:border-white transition-all">
                    How it works
                  </span>
                </button>
              </div>

              {/* --- MODAL COMPONENT (Rendered conditionally) --- */}
              <ExecutionFlowModal 
                isOpen={showExecutionModal} 
                onClose={() => setShowExecutionModal(false)} 
              />

            </div>
          </div>
        </div>
      </div>

      {/* Section Experience institutional-grade trading infrastructure */}
      <div className="w-full" style={{ background: "transparent" }}>
        <section className="w-full flex justify-center py-[60px]">
            {/* Card */}
            <div
              className="w-full max-w-[1276px] h-auto rounded-[16px] px-[60px] py-[48px] flex flex-col"
              style={{
                background: "transparent",
                filter:
                  "drop-shadow(0 9px 25.5px rgba(0, 0, 0, 0.50)) drop-shadow(-6px -7px 42px rgba(75, 84, 98, 0.25))",
              }}
            >
              {/* Row 1: Title */}
              <div className="w-full flex justify-center mb-[40px]">
                <h2
                  className="text-white text-center"
                  style={{
                    fontFamily: '"Gramatika Trial", sans-serif',
                    fontSize: "48px",
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "54px",
                  }}
                >
                  Experience institutional-grade trading
                  <br />
                  infrastructure
                </h2>
              </div>

              {/* Row 2: 4 columns */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[24px]">
                {[
                  {
                    iconSrc: "/assets/ion_flash-outline.svg",
                    title: "Lightning Fast",
                    desc: "Seamless order execution with optimized routing across all major exchanges and liquidity pools.",
                  },
                  {
                    iconSrc: "/assets/hugeicons_blockchain-02.svg",
                    title: "65+ Blockchains",
                    desc: "Trade assets across Ethereum, Solana, Bitcoin, and 60+ other networks in one interface.",
                  },
                  {
                    iconSrc: "/assets/system-uicons_graph-bar.svg",
                    title: "Deep Liquidity",
                    desc: "Aggregated liquidity from 100+ sources ensures minimal slippage and reduced fees.",
                  },
                  { 
                    iconSrc: "/assets/marketeq_secure.svg",
                    title: "Decentralized",
                    desc: "Your keys, your crypto. Trade directly from your wallet with no intermediaries. ",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center"
                  >

                  {/* Icon container */}
                  <div
                    className="flex items-center justify-center mb-[18px]"
                    style={{
                      ...iconBaseStyle,
                      ...(item.iconStyle ?? {
                        borderRadius: "12.917px",
                        background:
                          "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
                      }),
                    }}
                  >
                    <img src={item.iconSrc} alt="" className="w-full h-full object-contain" />
                  </div>


                    {/* Title */}
                    <h3
                      className="text-white mb-[12px]"
                      style={{
                        fontFamily: '"Gramatika Trial", sans-serif',
                        fontSize: "24px",
                        fontStyle: "normal",
                        fontWeight: 500,
                        lineHeight: "25.8px",
                        textAlign: "center",
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-white max-w-[260px]"
                      style={{
                        fontFamily: "ABeeZee, sans-serif",
                        fontSize: "15px",
                        fontStyle: "normal",
                        fontWeight: 400,
                        lineHeight: "24px",
                        letterSpacing: "0.169px",
                        textAlign: "center",
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

            </div>
        </section>
      </div>

    </div>
  );
}
