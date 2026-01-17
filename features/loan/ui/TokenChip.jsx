export default function TokenChip({ logo, code, network }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden shrink-0 flex items-center justify-center">
        {logo ? (
          <img
            src={logo}
            alt={code || ""}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <span className="text-xs text-white/70">
            {(code || "?").slice(0, 1)}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="text-white text-sm leading-none truncate">{code}</div>
        <div className="text-[11px] text-white/60 truncate">{network}</div>
      </div>
    </div>
  );
}
