"use client";

import React, { useMemo, useState } from "react";
import ConfirmLoanModalView from "@/features/loan/ui/ConfirmLoanModalView";
import ProgressLoanModalView from "@/features/loan/ui/ProgressLoanModalView";

export default function ConfirmLoanDevPreviewPage() {
  // Mock summary data (edit freely to test layouts)
  const summary = useMemo(
    () => ({
      loanId: "demo-loan-id",
      collateralAmount: 0.25,
      collateralCode: "ETH",
      loanAmount: 500,
      borrowCode: "USDC",
      borrowNetwork: "ARBITRUM",
      duration: "long",
      ltv: 65,
      apr: 12.5,
      monthlyInterest: 5.2,
      fee: 3.1,
      liquidationPrice: 1450,
    }),
    []
  );

  // UI states for Confirm Modal
  const [open, setOpen] = useState(true);
  const [address, setAddress] = useState("0x1234...abcd");

  const [validating, setValidating] = useState(false);
  const [remoteValid, setRemoteValid] = useState(true);
  const [addressError, setAddressError] = useState("");

  const [loadingFresh, setLoadingFresh] = useState(false);
  const [freshError, setFreshError] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [flowError, setFlowError] = useState("");

  const [confirmingOrPaying, setConfirmingOrPaying] = useState(false);
  const [txId, setTxId] = useState("");

  const isAddressValid = !!address.trim() && !addressError && remoteValid === true;

  // --- NEW UI STATES FOR PROGRESS MODAL ---
  const [openProgress, setOpenProgress] = useState(false);
  // Status simulation: 0 = Signed, 1 = Processing, 2 = Active (Done)
  const [simulatedStatusStep, setSimulatedStatusStep] = useState(0); 

  const resetMessages = () => {
    setAddressError("");
    setFreshError("");
    setSubmitError("");
    setFlowError("");
  };

  return (
    <div className="min-h-screen p-6 text-white">
      <h1 className="text-xl font-semibold mb-4">Loan Modals Preview</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center rounded-xl border border-white/10 bg-white/5 p-4 mb-8">
        <h2 className="w-full text-sm text-gray-400 font-bold mb-2">Confirm Modal Controls</h2>
        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => {
            setOpen(true);
            setOpenProgress(false);
          }}
        >
          Open Confirm
        </button>

        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => setOpen(false)}
        >
          Close Confirm
        </button>

        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => {
            setTxId("");
            setConfirmingOrPaying(false);
            resetMessages();
          }}
        >
          Reset state
        </button>

        <div className="w-full h-px bg-white/10 my-2" />
        
        <h2 className="w-full text-sm text-gray-400 font-bold mb-2">Progress Modal (Stepper) Controls</h2>
        
        <button
          className="px-3 py-2 rounded-lg border border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300"
          onClick={() => {
            setOpen(false); // Close confirm
            setOpenProgress(true); // Open new modal
            setSimulatedStatusStep(0); // Reset step
          }}
        >
          Test Progress Modal
        </button>

        {openProgress && (
          <div className="flex gap-2 ml-4">
            <button className="px-2 py-1 text-xs border border-white/20 rounded" onClick={() => setSimulatedStatusStep(0)}>Step 1 (Tx Sent)</button>
            <button className="px-2 py-1 text-xs border border-white/20 rounded" onClick={() => setSimulatedStatusStep(1)}>Step 2 (Verifying)</button>
            <button className="px-2 py-1 text-xs border border-white/20 rounded" onClick={() => setSimulatedStatusStep(2)}>Step 3 (Active/Done)</button>
          </div>
        )}

      </div>

      <ConfirmLoanModalView
        open={open}
        onClose={() => setOpen(false)}
        summary={summary}
        loanId={summary.loanId}
        address={address}
        onAddressChange={(v) => setAddress(v)}
        validating={validating}
        remoteValid={remoteValid}
        addressError={addressError}
        loadingFresh={loadingFresh}
        freshError={freshError}
        submitError={submitError}
        flowError={flowError}
        txId={txId}
        confirmingOrPaying={confirmingOrPaying}
        isAddressValid={isAddressValid}
        onConfirm={() => {
          setConfirmingOrPaying(true);
          // Simulate wallet signature and open Progress Modal
          setTimeout(() => {
            setConfirmingOrPaying(false);
            setTxId("0xDEMO_TX_123");
            setOpen(false); // Close confirm modal
            setOpenProgress(true); // Open progress modal
          }, 800);
        }}
        statusContent={null} // We will remove this from the real flow later
      />

      <ProgressLoanModalView
        open={openProgress}
        onClose={() => setOpenProgress(false)}
        txId={txId || "0xDEMO_TX_123"}
        currentStep={simulatedStatusStep} 
        onTestStepChange={setSimulatedStatusStep}
      /> 

    </div>
  );
}