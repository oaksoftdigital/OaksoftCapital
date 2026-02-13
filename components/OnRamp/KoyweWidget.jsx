import React, { useState } from 'react';

/**
 * KoyweWidget Component (Dynamic Import Fix)
 * Fixes "window is not defined" by loading the SDK only on button click.
 */
const KoyweWidget = ({ 
  userAddress, 
  symbol = 'USDC', 
  network = 'polygon' 
}) => {
  
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenKoywe = async () => {
    try {
      setIsLoading(true);
      
      // 1. Dynamic Import: Load the SDK only on the client side when needed
      // This prevents the "window is not defined" error during server rendering
      const { KoyweRampSDK } = await import('@koyweforest/koywe-ramp-sdk');

      // 2. Configure the SDK instance
      // Note: Make sure you have the ID in your .env.local or use a fallback for testing
      const organizationId = process.env.NEXT_PUBLIC_KOYWE_ORG_ID || 'TU_ORG_ID_AQUI';
      
      const koywe = new KoyweRampSDK({
        organizationId: organizationId, 
        address: userAddress,
        token: symbol,
        chain: network,
        language: 'en', 
        color: '#3b82f6',
      });

      // 3. Open the modal
      koywe.show();
      
    } catch (error) {
      console.error("Failed to load Koywe SDK:", error);
      alert("Could not load the payment widget. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userAddress) {
    return <div className="text-red-500">Please connect wallet to continue.</div>;
  }

  return (
    <div className="w-full h-[400px] flex flex-col justify-center items-center bg-[#161B26] rounded-xl border border-white/10 p-8 text-center">
      
      <div className="mb-6 bg-blue-500/10 p-4 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>

      <h3 className="text-white text-xl font-bold mb-2">Buy Crypto with Fiat</h3>
      <p className="text-gray-400 mb-8 max-w-xs">
        Use your credit card or bank transfer to buy {symbol} directly to your wallet.
      </p>

      <button
        disabled={true} 
        className="px-8 py-3 bg-gray-600 text-gray-400 font-bold rounded-xl cursor-not-allowed w-full max-w-[280px] border border-gray-500/30"
      >
        Coming Soon
      </button>
      {/* <button
        onClick={handleOpenKoywe}
        disabled={isLoading}
        className={`px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 w-full max-w-[280px] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Loading...' : 'Start Purchase'}
      </button> */}
      
    </div>
  );
};

export default KoyweWidget;