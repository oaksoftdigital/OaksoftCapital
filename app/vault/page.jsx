"use client";

import { useRef, useState } from "react";

export default function VaultPage() {

  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);


  const vaultCards = [
    {
      icon: "/assets/marketeq_secureCheck.svg",
      title: "Advanced Risk Management",
      description:
        "Safeguard your investments with slippage limits, P&L stop losses, auditable, open source code",
    },
    {
      icon: "/assets/mage_filter.svg",
      title: "Customizable Investment Strategies",
      description:
        "Get exposure to BTC as well as time tested staking pools withing our vault",
    },
    {
      icon: "/assets/heroicons_key.svg",
      title: "Your Funds, Your Control",
      description:
        "Fully decentralized, non-custodial investment vault designed to grow your wealth while keeping you in control.",
    },

  ];

  return (
    <div className="min-h-screen bg-transparent">
      {/* Title */}
      <div className="flex justify-center pt-[60px] mb-[60px] px-4">
        <h1
          className="text-white text-center align-middle uppercase whitespace-normal sm:whitespace-nowrap"
          style={{
            fontFamily: "var(--font-abhaya-libre), serif",
            fontWeight: 800,
            fontSize: "clamp(24px, 6vw, 48px)",
            lineHeight: "1.3",
            letterSpacing: "clamp(1px, 1.2vw, 11px)",
            maxWidth: "100%",
          }}
        >
          Investment Vault
        </h1>
      </div>

      {/* Main content */}
      <section
        className="w-full"
        style={{
          background: "linear-gradient(0deg, #151A23 0%, #151A23 100%), #FFF",
        }}
      >
        <div className="mx-auto w-full max-w-[1300px] px-4 py-10 lg:px-0">
          <div
            className="flex flex-col gap-6 md:flex-row md:gap-10 items-stretch"
            style={{
              display: "flex",
              padding: "50px 40px",
              borderRadius: "12.917px",
              border: "2.348px solid rgba(255, 255, 255, 0.10)",
              background:
                "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
              boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
              backdropFilter: "blur(20.138256072998047px)",
            }}
          >
            {/* LEFT */}
            <div className="h-full w-full md:flex-[0_0_40%] md:min-w-0 rounded-2xl flex flex-col">
              <div className="flex-1 flex items-start mb-6 md:mb-8 lg:mb-0">
                <h1 className="text-white font-['Gramatika_Trial', 'Helvetica', 'Arial', 'sans-serif'] font-semibold tracking-[clamp(0.2px,0.12vw,0.988px)] text-[clamp(30px,5.5vw,76px)] leading-[clamp(34px,5.2vw,70px)]">
                  <span className="block">Take Control</span>
                  <span className="block">of Your </span>
                  <span className="block">Investments</span>
                  <span className="block">with Our</span>
                  <span className="block">Decentralized</span>
                  <span className="block">Vault!</span>
                </h1>
              </div>

              <div className="mt-8 rounded-2xl">
                <div className="space-y-4">
                  <p className="text-white font-['Gramatika_Trial','Helvetica','Arial','sans-serif'] font-normal tracking-[1.125px] text-[14px] leading-[16px] md:text-[17px] md:leading-[24px]">
                    Invest with confidence in a fully decentralized, non-custodial investment vault designed to grow your wealth while keeping you in control.
                  </p>

                  <a
                    href="https://dhedge.org/vault/0x371b681fe4f53ed19ca9973ed7e6b23d970bbbf6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full md:w-auto justify-center items-center rounded-[8px] bg-[#95E100] text-black px-[41px] py-[21px]"
                  >
                    Explore the Vault
                  </a>
                </div>
              </div>
            </div>


            {/* RIGHT */}
            <div className="relative w-full md:flex-[0_0_calc(60%-40px)] md:min-w-0 md:self-stretch bg-blue-500/10 outline outline-1 outline-blue-500/30 rounded-2xl overflow-hidden flex flex-col min-h-0">
              <video
                ref={videoRef}
                className="w-full flex-1 object-cover min-h-0"
                poster="/assets/placeholderVideoVault.jpg"
                playsInline
                preload="metadata"
                controls={isVideoPlaying}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
              >
                <source src="/assets/videoHero.mp4" type="video/mp4" />
              </video>

              {!isVideoPlaying && (
                <button
                  type="button"
                  aria-label="Play video"
                  className="absolute bottom-[34px] right-[43px] inline-flex items-center justify-center cursor-pointer"
                  onClick={() => {
                    const videoEl = videoRef.current;
                    if (!videoEl) return;
                    videoEl.play();
                  }}
                >
                  <span className="relative inline-block">
                    <img src="/assets/Ellipse1.svg" alt="" className="block" />
                    <img
                      src="/assets/Play.svg"
                      alt=""
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* New Cards Section */}
        <section className="w-full">
          <div className="mx-auto w-full max-w-[1300px] px-4 pb-12 lg:px-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {vaultCards.map((cardVault, idx) => (
                <div
                  key={idx}
                  className="bg-[#161B26] shadow-[-6px_-4px_10.3px_0_rgba(75,84,98,0.20),_0_4px_20.6px_0_rgba(0,0,0,0.50)] p-[30px_25px] flex flex-col items-start gap-[18.74px] rounded-2xl"
                >
                  <img src={cardVault.icon} alt={cardVault.title} className="w-[50px] h-[50px]" />

                  <h3 className="text-white font-['Gramatika_Trial','Helvetica','Arial','sans-serif'] font-medium text-[18px] md:text-[24px] leading-[25.8px]">
                    {cardVault.title}
                  </h3>

                  <p className="text-white font-['Gramatika_Trial','Helvetica','Arial','sans-serif'] text-[15px] leading-[24px] tracking-[0.169px]">
                    {cardVault.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </section>
    </div>
  );
}
