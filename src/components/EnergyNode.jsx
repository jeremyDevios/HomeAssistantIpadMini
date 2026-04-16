var ICON_SIZE_SM = 32
var ICON_SIZE_LG = 40

function SolarIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="4" fill={color} />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function BatteryIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <rect x="2" y="7" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <path d="M20 10h2v5h-2" fill={color} />
      <rect x="4" y="9" width="11" height="7" rx="1" fill={color} />
    </svg>
  )
}

function HouseIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" stroke={color} strokeWidth="2"
        strokeLinejoin="round" fill={color} fillOpacity="0.3" />
      <path d="M3 9.5L12 3l9 6.5" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="7" rx="1" fill={color} />
    </svg>
  )
}

function GridIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getIcon(type, size, color) {
  if (type === 'solar')       return <SolarIcon size={size} color={color} />
  if (type === 'battery')     return <BatteryIcon size={size} color={color} />
  if (type === 'house')       return <HouseIcon size={size} color={color} />
  if (type === 'consumption') return <HouseIcon size={size} color={color} />
  if (type === 'grid')        return <GridIcon size={size} color={color} />
  return null
}

export default function EnergyNode({ type, color, label, watts, subLabel, size }) {
  var isLarge    = size === 'lg'
  var ringPx     = isLarge ? 112 : 96
  var innerPx    = isLarge ? 80  : 64
  var iconSize   = isLarge ? ICON_SIZE_LG : ICON_SIZE_SM
  var wattFontSz = isLarge ? 28 : 22

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {label ? (
        <p style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: color,
          opacity: 0.7,
          marginBottom: 8,
          textAlign: 'center',
          maxWidth: ringPx,
        }}>
          {label}
        </p>
      ) : null}

      {/* Outer glow ring */}
      <div style={{
        width: ringPx,
        height: ringPx,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle, ' + color + '22 0%, ' + color + '08 70%, transparent 100%)',
        boxShadow: '0 0 24px ' + color + '44, 0 0 8px ' + color + '22',
        border: '2px solid ' + color + '55',
        flexShrink: 0,
      }}>
        {/* Inner circle */}
        <div style={{
          width: innerPx,
          height: innerPx,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle, ' + color + '33 0%, #0d111780 100%)',
          border: '1.5px solid ' + color + '88',
        }}>
          {getIcon(type, iconSize, color)}
        </div>
      </div>

      {/* Wattage */}
      {watts !== null && watts !== undefined ? (
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 8 }}>
          <span style={{ fontSize: wattFontSz, fontWeight: 700, color: color, fontVariantNumeric: 'tabular-nums' }}>
            {watts}
          </span>
          <span style={{ fontSize: 13, color: '#ffffff', opacity: 0.4, marginLeft: 3 }}>W</span>
        </div>
      ) : null}

      {/* Sub-label */}
      {subLabel ? (
        <p style={{ fontSize: 11, color: '#ffffff', opacity: 0.45, marginTop: 4 }}>{subLabel}</p>
      ) : null}

    </div>
  )
}
