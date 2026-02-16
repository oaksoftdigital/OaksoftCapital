"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getLoanById, saveUserEmail } from "../services/coinrabbit";
import { useConfirmAndPayCollateral } from "../hooks/useConfirmAndPayCollateral";
import { useValidateAddress } from "@/features/loan/hooks/useValidateAddress";
import { useRouter } from "next/navigation";
import LoanStatusLabel from "@/features/loan/ui/LoanStatusLabel";
import ConfirmLoanModalView from "./ConfirmLoanModalView";
import ProgressLoanModalView from "@/features/loan/ui/ProgressLoanModalView";

import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function ConfirmLoanModal({ open, onClose, loan, summary, onConfirmed }) {

  //Email if is Anonymous
  const [isAnon, setIsAnon] = useState(false);
  const [contactEmail, setContactEmail] = useState("");


  const [address, setAddress] = useState("");

  const router = useRouter();
  const [startListen, setStartListen] = useState(false);
  
  const [submitError, setSubmitError] = useState("");

  // Fresh loan state
  const [freshLoan, setFreshLoan] = useState(null);
  const [loadingFresh, setLoadingFresh] = useState(false);

  // Error handling states
  const [freshError, setFreshError] = useState("");
  const [ignoredFlowError, setIgnoredFlowError] = useState(null);
  const [displayError, setDisplayError] = useState(""); 

  const [busyLabel, setBusyLabel] = useState("");

  const [currentStep, setCurrentStep] = useState(0);

  const hasSummary = !!summary;

  const loanId = useMemo(
    () =>
      summary?.loanId ??
      loan?.response?.id ??
      loan?.response?.loan_id ??
      loan?.response?.loan?.id ??
      loan?.id ??
      null,
    [summary, loan]
  );

  const effectiveLoan = freshLoan ?? loan;

  // Network to validate against:
  const payoutNetwork = useMemo(() => {
    const n = summary?.borrowNetwork || summary?.borrowCode || "";
    return String(n).trim().toUpperCase();
  }, [summary?.borrowNetwork, summary?.borrowCode]);

  const {
  validating,
  valid: remoteValid,
  error: addressError,
} = useValidateAddress({
  address,
  code: summary?.borrowCode,
  network: payoutNetwork,
  enabled: open,
});


  // Hook that does: final validate -> confirm -> open wallet -> pay collateral
  const { run, loading: confirmingOrPaying, txId, error: flowError } =
    useConfirmAndPayCollateral({ summary, payoutNetwork });

  const locked = confirmingOrPaying || !!txId || startListen;




  // Smart error formatting
  const activeFlowError = flowError === ignoredFlowError ? null : flowError;
  const rawError = submitError || activeFlowError;
  useEffect(() => {
    if (!rawError) {
      setDisplayError("");
      return;
    }

    // 1. Change to console.log so Next.js doesn't show the red dev overlay
    console.log("Wallet Tx Error (Debug):", rawError);

    // 2. Safely convert to string
    const errorString = typeof rawError === "string" ? rawError : (rawError?.message || JSON.stringify(rawError));
    const lower = errorString.toLowerCase();

    // 3. Set human readable message based on keywords
    if (lower.includes("insufficient funds") || lower.includes("gas * price + value") || lower.includes("balance")) {
      setDisplayError("You don't have enough funds to cover the collateral and network fees.");
    } else if (lower.includes("reject") || lower.includes("denied") || lower.includes("user denied")) {
      setDisplayError("Transaction was cancelled in your wallet.");
    } else {
      setDisplayError("Transaction failed. Please check your wallet or network.");
    }
  }, [rawError]);

  // Listen for auth state to determine if anonymous
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsAnon(!!u?.isAnonymous);
    });
    return () => unsub();
  }, []);


  // Start listening when txId appears
  useEffect(() => {
    if (!open) return;
    if (txId) setStartListen(true);
  }, [txId, open]);


  // Reset input when modal opens
  useEffect(() => {
    if (!open) return;
    setAddress("");
    setSubmitError("");
    setStartListen(false);
    setContactEmail("");
    setIgnoredFlowError(flowError);
    setDisplayError("");
  }, [open]);

  // Load loan when modal opens
  useEffect(() => {
    if (!open || !loanId) return;

    let cancelled = false;

    (async () => {
      setLoadingFresh(true);
      setFreshError("");
      try {
        const data = await getLoanById(loanId);
        if (!cancelled) setFreshLoan(data);
      } catch (e) {
        if (!cancelled) setFreshError(e?.message || "Get loan failed");
      } finally {
        if (!cancelled) setLoadingFresh(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, loanId]);

  // Remote validate address with debounce (UX)


  if (!open) return null;

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
  };

  const isAddressValid = !!address.trim() && !addressError && remoteValid === true;

  const handleConfirm = async () => {
    if (!loanId) return;

    const a = address.trim();
    if (!a) {
      setSubmitError("Enter an address");
      return;
    }

    try {
      setSubmitError("");

      const dep = effectiveLoan?.response?.deposit || {};
      const needsRefresh = dep?.active === false || !dep?.send_address;

      setBusyLabel(needsRefresh ? "Refreshing deposit address..." : "Opening wallet...");

      // Save email only for guest (anonymous). Best effort: do not block the flow.
      if (isAnon && contactEmail?.trim()) {
        try {
          await saveUserEmail(contactEmail.trim());
        } catch (e) {
          console.warn("saveUserEmail failed:", e?.message || e);
        }
      }


      const { confirmRes, freshLoan: refreshed } = await run({
        loanId,
        payoutAddress: a,
      });

      setBusyLabel(""); // clear when done

      onConfirmed?.(confirmRes);
      if (refreshed) setFreshLoan(refreshed);
    } catch (err) {
      setSubmitError(err?.message || "Confirm failed");
    }
  };


  return (
    <>
      {/* 1. The core logic: Polling runs independently of the UI in the background */}
      {startListen && (
        <LoanStatusLabel
          loanId={loanId}
          start={true}
          finishedLabel="finished"
          onStepChange={setCurrentStep}
          onFinished={() => {
            onClose?.();
            router.push("/dashboard/loans");
            router.refresh();
          }}
        />
      )}

      {/* 2. The UI: Show one modal or another depending on whether there is a txId */}
      {!txId ? (
        <ConfirmLoanModalView
          open={open}
          // onClose={onClose}
          onClose={() => {
            if (rawError) router.refresh();
            onClose();
          }}
          summary={summary}
          loanId={loanId}
          address={address}
          onAddressChange={(v) => setAddress(v)}
          validating={validating}
          remoteValid={remoteValid}
          addressError={addressError}
          loadingFresh={loadingFresh}
          freshError={freshError}
          submitError={displayError}
          // flowError={flowError}
          txId={txId}
          confirmingOrPaying={confirmingOrPaying}
          isAddressValid={isAddressValid}
          showEmailInput={isAnon}
          contactEmail={contactEmail}
          onContactEmailChange={setContactEmail}
          onConfirm={handleConfirm}
        />
      ) : (
        <ProgressLoanModalView
          open={open}
          onClose={onClose}
          currentStep={currentStep}
          loanId={loanId}
          depositAddress={effectiveLoan?.response?.deposit?.send_address || ""}
          collateralAmount={summary?.collateralAmount || "0"}
          collateralCode={summary?.collateralCode || ""}
          receiveAmount={summary?.loanAmount || "0"}
          receiveCode={summary?.borrowCode || ""}
          userAddress={address}
        />
      )}
    </>
  );
  // return (
  //   <ConfirmLoanModalView
  //     open={open}
  //     onClose={onClose}
  //     summary={summary}
  //     loanId={loanId}
  //     address={address}
  //     onAddressChange={(v) => setAddress(v)}
  //     validating={validating}
  //     remoteValid={remoteValid}
  //     addressError={addressError}
  //     loadingFresh={loadingFresh}
  //     freshError={freshError}
  //     submitError={submitError}
  //     flowError={flowError}
  //     txId={txId}
  //     confirmingOrPaying={confirmingOrPaying}
  //     isAddressValid={isAddressValid}
  //     showEmailInput={isAnon}
  //     contactEmail={contactEmail}
  //     onContactEmailChange={setContactEmail}
  //     onConfirm={handleConfirm}
  //     statusContent={
  //       <LoanStatusLabel
  //         loanId={loanId}
  //         start={true}
  //         finishedLabel="finished"
  //         onStepChange={setCurrentStep}
  //         onFinished={() => {
  //           onClose?.();
  //           router.push("/dashboard/loans");
  //           router.refresh();
  //         }}
  //       />
  //     }
  //   />
  // );

}
