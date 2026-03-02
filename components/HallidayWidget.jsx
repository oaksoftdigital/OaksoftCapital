import React, { useState } from 'react';
import { openHallidayPayments } from '@halliday-sdk/payments';
import { connectWalletClient } from '@halliday-sdk/payments/viem';
import { useWalletClient } from 'wagmi';
import ConnectWalletButton from '../ConnectWalletButton';

/**
 * HallidayWidget Component
 * Implementation of Halliday Fiat On-Ramp using Wagmi/Viem.
 */
const HallidayWidget = ({ 
  userAddress, 
  symbol = 'USDC', 
  network = 'polygon' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the wallet client from Wagmi to share the connection with Halliday
  const { data: walletClient } = useWalletClient();

  const handleOpenHalliday = async () => {
    if (!userAddress || !walletClient) return;

    try {
      setIsLoading(true);

      // 1. Prepare the connected wallet client for the SDK
      const connectedWalletClient = connectWalletClient(() => walletClient);

      // 2. Open the widget with configuration
      // format for outputs: "chain:tokenAddress" or "chain:native"
      // For Polygon USDC: "polygon:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"
      await openHallidayPayments({
        apiKey: process.env.NEXT_PUBLIC_HALLIDAY_API_KEY || 'YOUR_HALLIDAY_API_KEY',
        destinationAddress: userAddress,
        outputs: [`${network}:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359`], 
        windowType: 'MODAL',
        owner: { address: userAddress, ...connectedWalletClient },
        funder: { address: userAddress, ...connectedWalletClient },
        customStyles: {
          primaryColor: '#3b82f6', // matches your blue-600
          backgroundColor: '#161B26', // matches your background
          textColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      });

    } catch (error) {
      console.error("Halliday SDK Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userAddress) {
    return (
      <div className="w-full h-[400px] flex flex-col justify-center items-center bg-[#161B26] rounded-xl border border-white/10 p-8 text-center">
        <p className="text-gray-400 mb-6 text-lg">Please connect wallet to continue.</p>
        <ConnectWalletButton />
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] flex flex-col justify-center items-center bg-[#161B26] rounded-xl border border-white/10 p-8 text-center">
      <div className="mb-6 bg-blue-500/10 p-4 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>

      <h3 className="text-white text-xl font-bold mb-2">Buy Crypto</h3>
      <p className="text-gray-400 mb-8 max-w-xs">
        Buy {symbol} on {network} directly to your wallet using Halliday.
      </p>

      <button
        onClick={handleOpenHalliday}
        disabled={isLoading}
        className={`px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 w-full max-w-[280px] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Loading...' : 'Start Purchase'}
      </button>
    </div>
  );
};

export default HallidayWidget;