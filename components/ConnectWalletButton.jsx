"use client";

/*
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AppKitButton = dynamic(
  () => import("@reown/appkit/react").then((m) => m.AppKitButton),
  { ssr: false }
);

export default function ConnectWalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <AppKitButton/>;
}*/

import { useEffect, useState } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

export default function ConnectWalletButton({ iconOnly = false }) {
  const [mounted, setMounted] = useState(false);
  const { open } = useAppKit();
  // useAppKitAccount to support EVM, Solana, Bitcoin, etc.
  const { address, isConnected } = useAppKitAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 1. CONNECTED STATE: Show the Label/Badge (WalletBadge style)
  if (isConnected && address) {
    return (
      <button 
        onClick={() => open()} // Open the modal to disconnect or change network
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer"
        }}
      >
        <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-100 border border-white/10 text-xs font-medium hover:bg-gray-700 transition-colors">
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
      </button>
    );
  }

  // 2. DISCONNECTED STATE: Show custom buttons
  const baseStyle = {
    cursor: "pointer",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    backgroundColor: "#95E100", // green color
    color: "#000000",
    fontWeight: "600",
  };

  // ICON VERSION (for widgets)
  if (iconOnly) {
    return (
      <button
        onClick={() => open()}
        style={{
          ...baseStyle,
          width: "42px",
          height: "42px",
          borderRadius: "50%",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h4" />
          <rect width="8" height="8" x="14" y="11" rx="2" />
        </svg>
      </button>
    );
  }

  // LARGE BUTTON VERSION (main)
  return (
    <button
      onClick={() => open()}
      style={{
        ...baseStyle,
        padding: "10px 20px",
        borderRadius: "10px",
        fontSize: "14px",
      }}
    >
      Connect Wallet
    </button>
  );
}