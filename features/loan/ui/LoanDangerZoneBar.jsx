// features/loan/ui/LoanDangerZoneBar.jsx
"use client";

import { normalizeZone, zoneToLabel, zoneToText, isDangerZone } from "@/features/loan/utils/zone";

export default function LoanDangerZoneBar({
  zone,
  showLabel = true,
  showHelpText = true,
}) {
  const z = normalizeZone(zone);
  const label = zoneToLabel(z);
  const text = zoneToText(z);
  const danger = isDangerZone(z);

  // 1. Calculamos el porcentaje de la zona (0 a 100%)
  const fillPercentage = z === null ? 0 : ((z + 2) / 5) * 100;

  // 2. Calculamos el ángulo:
  // -180 grados = Barra vacía (0%)
  // -90 grados  = Barra a la mitad (50%)
  // 0 grados    = Barra llena (100%)
  const rotationAngle = (fillPercentage / 100 * 180) - 180;

  const zoneColors = {
    "-1": "bg-red-500/10 border-red-500/30 text-red-500",
    "0":  "bg-red-500/10 border-red-500/30 text-red-500",
    "1":  "bg-orange-500/10 border-orange-500/30 text-orange-500",
    "2":  "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
    "3":  "bg-[#95E100]/10 border-[#95E100]/30 text-[#95E100]",
  };

  const badgeColor = z === null ? "bg-white/5 border-white/10 text-[#9BA2AE]" : zoneColors[z];

return (
    <div className="flex flex-col gap-4 w-full items-center">
      
      {/* Header */}
      {showLabel && (
        <div className="flex w-full items-center justify-start">
          <span className="text-white text-lg font-medium">Loan Health</span>
        </div>
      )}

      {/* Semi-circle Gauge SVG */}
      <div className="w-full flex justify-center mt-2 relative">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="284" 
          height="161" 
          viewBox="0 0 284 161" 
          fill="none"
        >
          <defs>
            <linearGradient id="danger_zone_grad" x1="-10.9722" y1="160.901" x2="249.726" y2="160.901" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF3B43"/>
              <stop offset="0.269231" stopColor="#FF7A00"/>
              <stop offset="0.596154" stopColor="#F2BA00"/>
              <stop offset="1" stopColor="#4EAB34"/>
            </linearGradient>
            
            <mask id="sweepMask">
              <g style={{
                transformOrigin: "142px 160px", 
                transform: `rotate(${rotationAngle}deg)`,
                transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" 
              }}>
                <rect x="-100" y="-100" width="500" height="260" fill="white" />
              </g>
            </mask>
          </defs>

          {/* SVG Fondo (Gris Oscuro) */}
          <path d="M273.372 160.049C278.512 160.756 283.284 157.161 283.648 151.986C284.846 135.003 282.981 117.915 278.116 101.546C272.357 82.1709 262.529 64.2481 249.287 48.9763C236.046 33.7044 219.697 21.4355 201.333 12.9898C182.969 4.54407 163.013 0.11621 142.801 0.00225684C122.588 -0.111696 102.584 4.09088 84.1257 12.329C65.6677 20.5671 49.1811 32.6509 35.7683 47.7725C22.3555 62.8941 12.3255 80.7049 6.34903 100.014C1.29988 116.327 -0.757795 133.392 0.247975 150.388C0.554457 155.567 5.28544 159.215 10.4329 158.567L34.0585 155.592C39.206 154.944 42.8065 150.242 42.647 145.057C42.3097 134.094 43.7886 123.129 47.0443 112.61C51.2279 99.0934 58.2488 86.6259 67.6378 76.0408C77.0268 65.4557 88.5674 56.997 101.488 51.2303C114.409 45.4636 128.412 42.5218 142.56 42.6016C156.709 42.6813 170.678 45.7808 183.533 51.6928C196.388 57.6048 207.832 66.1931 217.101 76.8834C226.37 87.5737 233.25 100.12 237.281 113.682C240.418 124.237 241.773 135.218 241.312 146.177C241.094 151.36 244.642 156.102 249.781 156.808L273.372 160.049Z" fill="#323841"/>
          
          {/* SVG Borde Delgado (Blanco) */}
          <path d="M142.798 0.501953C162.939 0.615521 182.825 5.02838 201.124 13.4443C219.423 21.8603 235.714 34.0859 248.909 49.3037C262.104 64.5217 271.899 82.3814 277.637 101.688C282.484 118 284.343 135.027 283.149 151.951C282.806 156.816 278.316 160.223 273.44 159.554L249.85 156.312C244.994 155.645 241.603 151.153 241.812 146.197C242.275 135.184 240.913 124.148 237.761 113.54C233.71 99.909 226.794 87.2997 217.479 76.5557C208.163 65.8118 196.661 57.18 183.742 51.2383C170.823 45.2966 156.783 42.1818 142.563 42.1016C128.343 42.0214 114.27 44.9778 101.284 50.7734C88.2986 56.5691 76.6999 65.0706 67.2637 75.709C57.8275 86.3473 50.771 98.8775 46.5664 112.462C43.2944 123.034 41.8085 134.054 42.1475 145.072C42.2998 150.03 38.8588 154.483 33.9961 155.096L10.3701 158.071C5.48734 158.686 1.03516 155.227 0.74707 150.358C-0.255106 133.422 1.79582 116.418 6.82715 100.162C12.7826 80.9209 22.777 63.1728 36.1426 48.1045C49.5081 33.0362 65.9361 20.9943 84.3291 12.7852C102.722 4.57604 122.656 0.388402 142.798 0.501953Z" stroke="white" strokeOpacity="0.25"/>

          {/* SVG Color (Aplicando la máscara rotativa) */}
          <g mask="url(#sweepMask)">
            <path d="M201.333 12.9898C216.359 19.9006 230.037 29.3713 241.767 40.9524C246.09 45.2207 245.566 52.2025 240.976 56.1823L225.412 69.6773C220.822 73.6571 213.913 73.11 209.45 68.9876C201.791 61.9115 193.048 56.069 183.533 51.6928C170.678 45.7808 156.709 42.6813 142.56 42.6016C128.412 42.5218 114.409 45.4636 101.488 51.2303C88.5674 56.997 77.0268 65.4557 67.6378 76.0408C58.2488 86.6259 51.2279 99.0934 47.0443 112.61C43.7497 123.255 42.2746 134.356 42.6599 145.45C42.8324 150.418 39.3809 154.922 34.4493 155.543L10.0421 158.616C5.11045 159.237 0.579179 155.743 0.271787 150.781C-0.78935 133.656 1.26095 116.453 6.34903 100.014C12.3255 80.7049 22.3555 62.8941 35.7683 47.7725C49.1811 32.6509 65.6677 20.5671 84.1257 12.329C102.584 4.09088 122.588 -0.111696 142.801 0.00225684C163.013 0.11621 182.969 4.54407 201.333 12.9898Z" fill="url(#danger_zone_grad)"/>
          </g>
        </svg>

        {/* Badge centrado en la parte inferior de la media luna */}
        {showLabel && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
              {label === "—" ? "ZONE —" : `ZONE ${label}`}
            </span>
          </div>
        )}
      </div>

      {/* Help Text */}
      {showHelpText && (
        <div className="text-[#9BA2AE] text-sm text-center">
          {z === null
            ? "Zone not available yet."
            : danger
              ? `Status: ${text}. Consider increasing collateral or repaying to reduce risk.`
              : `Status: ${text}.`}
        </div>
      )}
    </div>
  );
}