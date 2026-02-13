import React from "react";

const ExecutionFlowModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Base icon styles
  const iconBaseStyle = {
    width: "68px",
    height: "68px",
    padding: "20px",
    boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
    backdropFilter: "blur(20.138256072998047px)",
    WebkitBackdropFilter: "blur(20.138256072998047px)",
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{
        background: "rgba(0, 0, 0, 0.50)",
        backdropFilter: "blur(14.899999618530273px)",
        WebkitBackdropFilter: "blur(14.899999618530273px)",
      }}
    >
      <div
        className="relative bg-[#161B26] rounded-2xl p-6 sm:p-10 w-full mx-4 sm:mx-0 max-w-[800px] max-h-[90vh] overflow-y-auto overflow-x-hidden"
        style={{
          border: "1px solid rgba(255, 255, 255, 0.10)",
          background:
            "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
          backdropFilter: "blur(31.149999618530273px)",
          WebkitBackdropFilter: "blur(31.149999618530273px)",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 sm:right-6 sm:top-6 w-9 h-9 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white focus:outline-none z-50 transition-colors"
        >
          <span className="text-lg leading-none">×</span>
        </button>

        {/* Title */}
        <div className="w-full flex justify-center mb-10 mt-2">
          <h2
            className="text-white text-center"
            style={{
              fontFamily: '"Gramatika Trial", sans-serif',
              fontSize: "32px",
              fontWeight: 500,
              lineHeight: "40px",
            }}
          >
            Execution Flow
          </h2>
        </div>

        {/* Content Container */}
        <div className="relative w-full">
          
          {/* ========================================================= */}
          {/* BACKGROUND DECORATIONS (Vector + Dots) */}
          {/* ========================================================= */}

          {/* 1. TABLET / DESKTOP MODAL VIEW (2 Columns) */}
          {/* Visible on medium screens and up (md:block) */}
          <div className="pointer-events-none absolute inset-0 z-0 hidden md:block">
            {/* The curved connector line */}
            <img
              src="/assets/Vector6.png"
              alt=""
              style={{
                position: "absolute",
                left: "50%",
                top: "34px", 
                transform: "translate(-50%, 0) rotate(3.259deg)",
                width: "169.876px",
                height: "364.182px",
                opacity: 1,
              }}
            />
            
            {/* Dots for the 2-column layout (Centered along the vector flow) */}
            {[
              { left: "10%", top: "15%" }, 
              { left: "60%", top: "50%" }, 
              { left: "40%", top: "85%" }, 
            ].map((p, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  left: p.left,
                  top: p.top,
                  width: "10px",
                  height: "10px",
                  borderRadius: "9999px",
                  background: "#373D48",
                  transform: "translateX(-50%)" // Centers the dot horizontally
                }}
              />
            ))}
          </div>

          {/* 2. MOBILE VIEW (1 Column) */}
          {/* Visible only on small screens (md:hidden) */}
          <div className="pointer-events-none absolute inset-0 z-0 md:hidden">
            {[
              { left: "12%", top: "26px" },
              { left: "78%", top: "54px" },
              { left: "34%", top: "210px" },
              { left: "86%", top: "320px" },
            ].map((p, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  left: p.left,
                  top: p.top,
                  width: "10px",
                  height: "10px",
                  borderRadius: "9999px",
                  background: "#373D48",
                }}
              />
            ))}
          </div>
          {/* ========================================================= */}


          {/* === ITEMS GRID === */}
          {/* Grid: 1 column on Mobile, 2 columns on Tablet/Desktop */}
          <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-8">
            {[
              {
                iconSrc: "/assets/icons8_bank-card.svg",
                title: "Connect",
                desc: "Connect to the dApp using your web3 supported wallets such as Metamask or Rabby etc.",
                iconStyle: {
                  borderRadius: "137px",
                  background:
                    "linear-gradient(149deg, #00C2DC 3.34%, #007E97 102.38%)",
                },
              },
              {
                iconSrc: "/assets/iconamoon_send.svg",
                title: "Swap Quote",
                desc: "Determine the tokens and amount you want to swap and receive your output quote.",
                iconStyle: {
                  borderRadius: "137px",
                  background:
                    "linear-gradient(149deg, #18CA70 3.34%, #00984C 102.38%)",
                },
              },
              {
                iconSrc: "/assets/ic_outline-local-offer.svg",
                title: "Get Best Offer",
                desc: "Verify the details of the transaction and confirm its accuracy.",
                iconStyle: {
                  borderRadius: "137px",
                  background:
                    "linear-gradient(149deg, #FF783C 3.34%, #FF4F1E 102.38%)",
                },
              },
              {
                iconSrc: "/assets/line-md_bell-loop.svg",
                title: "Confirm and Enjoy",
                desc: "Confirm the swap transaction and enjoy the satisfaction of obtaining the best output.",
                iconStyle: {
                  borderRadius: "137px",
                  background:
                    "linear-gradient(149deg, #3A8FEF 3.34%, #005FDE 102.38%)",
                },
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                {/* Icon container relative parent for absolute positioning of the number */}
                <div
                  className="flex items-center justify-center mb-[18px] relative"
                  style={{
                    ...iconBaseStyle,
                    ...(item.iconStyle ?? {
                      borderRadius: "12.917px",
                      background:
                        "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
                    }),
                  }}
                >
                  <img
                    src={item.iconSrc}
                    alt={item.title}
                    className="w-full h-full object-contain relative z-10"
                  />
                  
                  {/* --- THE "BITE" WITH NUMBER --- */}
                  {/* 1. absolute bottom-0 right-0: Positions it in the corner.
                      2. translate-x/y: Moves it slightly out to create the "bite" look.
                      3. bg-[#161B26]: Matches the modal background to hide the icon gradient behind it.
                  */}
                  <div className="absolute bottom-0 right-0 translate-x-[30%] translate-y-[30%] w-9 h-9 bg-[#161B26] rounded-full flex items-center justify-center z-20 border-[3px] border-[#161B26]">
                     {/* Inner container: Now transparent, just centers the text */}
                     <div className="w-full h-full rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                        {/* Formats index 0 to "01", 1 to "02", etc. */}
                        {(idx + 1).toString().padStart(2, '0')}
                        </span>
                     </div>
                  </div>
                </div>

                <h3 className="text-white text-xl font-medium mb-3">
                  {item.title}
                </h3>

                <p className="text-white/80 text-sm leading-relaxed max-w-[280px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionFlowModal;