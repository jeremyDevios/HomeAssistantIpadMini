// SVG icons for each node type
const ICONS = {
  solar: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),
  battery: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <rect x="2" y="7" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M20 10h2v5h-2" fill="currentColor" />
      <rect x="4" y="9" width="11" height="7" rx="1" fill="currentColor" />
    </svg>
  ),
  house: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" stroke="currentColor" strokeWidth="2"
        strokeLinejoin="round" fill="currentColor" opacity="0.3" />
      <path d="M3 9.5L12 3l9 6.5" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="9" y="14" width="6" height="7" rx="1" fill="currentColor" />
    </svg>
  ),
  consumption: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" stroke="currentColor" strokeWidth="2"
        strokeLinejoin="round" fill="currentColor" opacity="0.3" />
      <path d="M3 9.5L12 3l9 6.5" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="9" y="14" width="6" height="7" rx="1" fill="currentColor" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

export default function EnergyNode({ type, color, label, watts, subLabel, size = 'md' }) {
  const isLarge = size === 'lg'
  const ringSize  = isLarge ? 'w-28 h-28' : 'w-24 h-24'
  const innerSize = isLarge ? 'w-20 h-20' : 'w-16 h-16'
  const wattSize  = isLarge ? 'text-3xl'  : 'text-2xl'

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-medium tracking-widest uppercase opacity-60"
         style={{ color }}>
        {label}
      </p>

      {/* Outer glow ring */}
      <div
        className={`${ringSize} rounded-full flex items-center justify-center`}
        style={{
          background: `radial-gradient(circle, ${color}22 0%, ${color}08 70%, transparent 100%)`,
          boxShadow: `0 0 24px ${color}44, 0 0 8px ${color}22`,
          border: `2px solid ${color}55`,
        }}
      >
        {/* Inner circle */}
        <div
          className={`${innerSize} rounded-full flex items-center justify-center`}
          style={{
            background: `radial-gradient(circle, ${color}33 0%, #0d111780 100%)`,
            border: `1.5px solid ${color}88`,
          }}
        >
          <span style={{ color }}>{ICONS[type]}</span>
        </div>
      </div>

      {/* Wattage */}
      {watts !== null && (
        <div className="flex items-baseline gap-1">
          <span className={`${wattSize} font-bold tabular-nums`} style={{ color }}>
            {watts}
          </span>
          <span className="text-sm opacity-50">W</span>
        </div>
      )}

      {/* Sub-label (e.g., "Charging 82%") */}
      {subLabel && (
        <p className="text-xs opacity-50">{subLabel}</p>
      )}
    </div>
  )
}
