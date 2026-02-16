"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ProgressLoanModalView({
  open,
  onClose,
  currentStep = 0, // 0 = Awaiting, 1 = Processing, 2 = Sending, 3 = Success
  onTestStepChange,
  loanId = "Loading...",
  depositAddress = "Loading...",
  collateralAmount = "0",
  collateralCode = "...",
  receiveAmount = "0",
  receiveCode = "...",
  userAddress = "...",
}) {
  const [mounted, setMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isAddressCopied, setIsAddressCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  // --- Step definitions (This is what was missing in the error) ---
  const steps = [
    { title: "Awaiting Collateral", icon: "/assets/clock.svg" },
    { title: "Processing", icon: "/assets/hourglass.svg" },
    { title: "Sending Loan", icon: "/assets/arrowRight.svg" },
    { title: "Success", icon: "check" },
  ];

  // Calculate safe step number for the header
  const displayStep = Math.min(currentStep + 1, 4);


  
  const handleCopy = () => {
    navigator.clipboard.writeText(loanId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setIsAddressCopied(true);
    setTimeout(() => setIsAddressCopied(false), 2000);
  };
  
  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{
        background: "rgba(0, 0, 0, 0.50)",
        backdropFilter: "blur(14.899999618530273px)",
        WebkitBackdropFilter: "blur(14.899999618530273px)", 
      }}
    >
      {/* Main Container: 2 Columns on md+, 1 Column on mobile */}
      <div
        className="relative w-full max-w-[900px] mx-4 sm:mx-0 rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl"
        style={{
          border: "1px solid rgba(255, 255, 255, 0.10)",
          background:
            "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
          backdropFilter: "blur(31.149999618530273px)",
          WebkitBackdropFilter: "blur(31.149999618530273px)", 
        }}
      >
        
        {/* ========================================= */}
        {/* LEFT COLUMN (30%) - Stepper */}
        {/* ========================================= */}
        <div className="w-full md:w-[30%] p-6 sm:p-8 flex flex-col" style={{
            background: "#161B26",
            boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(31.149999618530273px)",
            WebkitBackdropFilter: "blur(31.149999618530273px)", // Safari support
          }}>
          
          <p className="text-[#9CA3AF] text-sm font-medium mb-8">
            Step {displayStep} of 4
          </p>

            <div className="flex flex-col relative">
              {steps.map((step, idx) => {
                // Determine the exact state of this step
                const isCompleted = currentStep > idx;
                const isCurrent = currentStep === idx;
                const isPending = currentStep < idx;
                const isLineGreen = currentStep > idx; // Line to next step is green if this step is done

                return (
                  <div key={idx} className="relative flex items-center gap-4 mb-8 last:mb-0">
                    
                    {/* Vertical Line Connector */}
                    {idx < steps.length - 1 && (
                      <div 
                        className={`absolute left-[20px] top-[40px] w-px h-8 -ml-px transition-colors duration-300 ${
                          isLineGreen ? "bg-[#95E100]" : "bg-white/20"
                        }`}
                      />
                    )}

                    {/* Icon Container with dynamic 3-state styles */}
                    <div 
                      className="shrink-0 flex items-center justify-center transition-all duration-300"
                      style={
                        isCurrent 
                          ? {
                              // 1. Current Step (Bright Green Background)
                              width: "40px",
                              height: "40px",
                              padding: "8px",
                              borderRadius: "9999px",
                              background: "#95E100",
                              boxShadow: "0 0 15px 0 rgba(149, 225, 0, 0.40)",
                            }
                          : isCompleted
                          ? {
                              // 2. Completed Step (Dark Green + Border)
                              width: "40px",
                              height: "40px",
                              padding: "9px 10.833px",
                              justifyContent: "center",
                              alignItems: "center",
                              borderRadius: "9999px",
                              border: "1px solid rgba(144, 217, 2, 0.50)",
                              background: "#384D29",
                            }
                          : {
                              // 3. Pending Step (Dark Grey)
                              width: "40px",
                              height: "40px",
                              padding: "8px",
                              borderRadius: "58px",
                              border: "1px solid rgba(255, 255, 255, 0.25)",
                              background: "#323841",
                            }
                      }
                    >
                      {isCompleted || step.icon === "check" ? (
                        // Checkmark SVG for completed steps OR the final Success step
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke={
                            isCurrent ? "#000000" : // Black if it's the current step (bright green bg)
                            isCompleted ? "#95E100" : // Green if it's completed (dark green bg)
                            "rgba(255, 255, 255, 0.5)" // Grey if it's pending (grey bg)
                          } 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="w-full h-full"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        // Standard icon for current or pending steps
                        <img 
                          src={step.icon} 
                          alt="" 
                          className="w-full h-full object-contain transition-all duration-300"
                          style={{
                            // Force black if current step, grey/faded if pending
                            filter: isCurrent ? "brightness(0)" : isPending ? "grayscale(100%) opacity(50%)" : "none"
                          }}
                        />
                      )}
                    </div>

                    {/* Step Text */}
                    <span 
                      className={`font-semibold text-base transition-colors duration-300 ${
                        isCurrent || isCompleted ? "text-white" : "text-white/70"
                      }`}
                    >
                      {step.title}
                    </span>

                  </div>
                );
              })}
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT COLUMN (70%) */}
        {/* ========================================= */}
        {/* 1. Adjusted padding: 31px on desktop, px-6 on mobile */}
        <div className="w-full md:w-[70%] px-6 py-8 md:p-[31px] flex flex-col relative z-0">
          
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 sm:right-6 sm:top-6 w-9 h-9 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="text-lg leading-none">×</span>
          </button>

          {/* ROW 1: Title */}
          <h2 
            className="mb-2 mt-4 md:mt-0"
            style={{ 
              color: "#FFF", 
              fontFamily: '"Gramatika Trial", sans-serif', 
              fontSize: "32px", 
              fontWeight: 500 
            }}
          >
            Get your loan
          </h2>

          {/* ROW 2: Description */}
          <p 
            className="mb-6"
            style={{ 
              color: "#9CA3AF", 
              fontFamily: '"Gramatika Trial", sans-serif', 
              fontSize: "16px", 
              fontWeight: 400, 
              lineHeight: "24px", 
              letterSpacing: "1.125px" 
            }}
          >
            Deposit collateral to the address below to receive your funds instantly.
          </p>

          {/* ROW 3: Loan ID + Copy */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-white text-base">Loan ID</span>
            <span className="text-white/70 font-mono text-base">{loanId}</span>
            <button 
              onClick={handleCopy} 
              className="ml-2 text-white/50 hover:text-white transition-colors"
              title="Copy Loan ID"
            >
              {isCopied ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#95E100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>

          {/* ROW 4: Secure Transaction */}
          {/* 2. Changed items-start to items-center for vertical alignment */}
          <div 
            className="flex items-center gap-4 p-5 mb-6"
            style={{
              borderRadius: "10px",
              background: "linear-gradient(129deg, rgba(255, 255, 255, 0.05) 39.82%, rgba(25, 120, 237, 0.05) 133.74%)"
            }}
          >
            {/* Left Column (Lock Icon) */}
            {/* 3. Removed mt-0.5 and increased icon size */}
            <div className="shrink-0 flex items-center justify-center">
              <img src="/assets/lock.svg" alt="Lock" className="w-8 h-8" />
            </div>

            {/* Right Column (Texts) */}
            <div className="flex flex-col">
              <h3 
                style={{ 
                  fontFamily: '"Gramatika Trial", sans-serif', 
                  fontSize: "16px", 
                  fontWeight: 500, 
                  lineHeight: "20px" 
                }}
              >
                <span style={{ color: "#95E100" }}>Secure </span>
                <span style={{ color: "#FFF" }}>Transaction</span>
              </h3>
              <p className="text-[#9CA3AF] text-sm mt-1 leading-relaxed">
                This deposit is protected by industry-standard encryption and smart contract audits.
              </p>
            </div>
          </div>

          {/* ROW 5: Collateral Deposit Details */}
          <div 
            className="flex flex-row justify-between items-center w-full mb-6"
            style={{
              padding: "20px 23.485px 25px 23.485px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              background: "#323841"
            }}
          >
            {/* Left Column (4 rows) */}
            <div className="flex flex-col flex-1 min-w-0 pr-4">
              
              {/* Row 1: Send Deposit */}
              <span className="text-[#9BA2AE] text-sm mb-1">
                Send Deposit
              </span>

              {/* Row 2: Icon + Amount */}
              <div className="flex items-center gap-3 mb-4">
                {/* Placeholder icon, replace with your actual crypto icon */}
                <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs">{collateralCode[0]}</span>
                </div>
                <span 
                  className="text-white font-medium whitespace-nowrap"
                  style={{ fontSize: "28px" }}
                >
                  {collateralAmount} {collateralCode}
                </span>
              </div>

              {/* Row 3: Deposit Address label */}
              <span className="text-[#9BA2AE] text-sm mb-1">
                Deposit Address
              </span>

              {/* Row 4: Address Box + Copy Button */}
              <div 
                className="flex items-center justify-between px-3 py-2 w-full max-w-[320px]"
                style={{
                  borderRadius: "9.394px",
                  border: "1.174px solid #1F242F",
                  background: "#161B26"
                }}
              >
                <span className="text-white text-md truncate font-mono mr-2">
                  {depositAddress}
                </span>
                
                <button 
                  onClick={handleCopyAddress} 
                  className="text-[#95E100] hover:text-white transition-colors shrink-0 ml-5"
                  title="Copy Address"
                >
                  {isAddressCopied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#95E100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
              </div>

            </div>

            {/* Right Column (QR Code Placeholder) */}
            <div className="shrink-0 bg-white rounded-lg flex items-center justify-center p-2" style={{ width: "100px", height: "100px" }}>
               {/* QR Component will go here */}
               <span className="text-black/50 text-xs text-center font-medium">QR<br/>Code</span>
            </div>
            
          </div>

          {/* ROW 6: You Get & Destination */}
          <div 
            className="flex flex-row items-center p-5 w-full"
            style={{
              borderRadius: "10px",
              background: "linear-gradient(129deg, rgba(255, 255, 255, 0.05) 39.82%, rgba(25, 120, 237, 0.05) 133.74%)"
            }}
          >
            {/* Left Column - 50% width */}
            <div className="flex items-center gap-3 w-1/2 pr-2">
              {/* Icon */}
              <div 
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: "48px",
                  height: "48px",
                  padding: "7px 10px 7px 9.98px",
                  borderRadius: "9999px",
                  background: "rgba(147, 222, 1, 0.20)"
                }}
              >
                <img src="/assets/bills.svg" alt="Bills" className="w-full h-full object-contain" />
              </div>
              
              {/* Texts */}
              <div className="flex flex-col min-w-0">
                <span className="text-[#9CA3AF] text-sm mb-1">
                  You Get
                </span>
                <span className="text-white text-lg font-medium truncate">
                  {receiveAmount} {receiveCode}
                </span>
              </div>
            </div>

            {/* Right Column - 50% width */}
            <div className="flex flex-col text-right w-1/2 pl-2">
               <span className="text-[#9CA3AF] text-sm mb-1">
                 Destination Wallet
               </span>
               <span className="text-white font-mono text-lg truncate">
                 {userAddress}
               </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}